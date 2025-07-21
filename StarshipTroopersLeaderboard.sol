// SPDX-License-Identifier: MIT
pragma solidity ^0.8.21;

/// @title Gas-Optimised Starship Troopers Leaderboard
/// @author  Open-Source Community
contract StarshipTroopersLeaderboard {
    /* ----------  Errors  ---------- */
    error InvalidInput(); // score==0 || level==0
    error NotHigherScore(); // new score ≤ current best
    error InvalidRange(); // for pagination bounds

    /* ----------  Data Model  ---------- */
    struct ScoreEntry {
        address player; // 20 bytes
        uint64 score; // 8 bytes
        uint32 level; // 4 bytes
        uint64 timestamp; // 8 bytes
    } // 40 bytes → 1 storage slot

    uint8 public constant MAX_LEADERBOARD_SIZE = 100;

    /* Mapping: every wallet → its personal best */
    mapping(address => ScoreEntry) public playerBest;

    /* Mapping: every wallet → total submission count */
    mapping(address => uint32) public playerSubmissionCount;

    /* Mapping: every wallet → referral count (how many people they referred) */
    mapping(address => uint32) public playerReferralCount;

    /* Fixed-size array: global top-100 (sorted desc) */
    ScoreEntry[MAX_LEADERBOARD_SIZE] private leaderboard;
    uint8 public leaderboardSize; // current filled length

    // Additional tracking variables
    uint64 public totalScoresSubmitted;
    uint64 public allTimeHighScore;
    address public championPlayer;

    /* ----------  Events  ---------- */
    event ScoreSubmitted(
        address indexed player,
        uint64 score,
        uint32 level,
        uint64 timestamp
    );

    event NewChampion(
        address indexed newChampion,
        uint64 newRecord,
        uint32 level
    );

    event ReferralCredited(
        address indexed referrer,
        address indexed newPlayer,
        uint32 newReferralCount
    );

    /* ----------  Write Function  ---------- */
    function submitScore(
        uint64 _score,
        uint32 _level,
        address _referrer
    ) external {
        if (_score == 0 || _level == 0) revert InvalidInput();

        ScoreEntry storage best = playerBest[msg.sender];
        if (_score <= best.score) revert NotHigherScore();

        // Check if this is first submission and process referral
        bool isFirstSubmission = playerSubmissionCount[msg.sender] == 0;
        if (
            isFirstSubmission &&
            _referrer != address(0) &&
            _referrer != msg.sender
        ) {
            unchecked {
                ++playerReferralCount[_referrer];
            }
            emit ReferralCredited(
                _referrer,
                msg.sender,
                playerReferralCount[_referrer]
            );
        }

        // update personal best
        ScoreEntry memory newEntry = ScoreEntry({
            player: msg.sender,
            score: _score,
            level: _level,
            timestamp: uint64(block.timestamp)
        });
        playerBest[msg.sender] = newEntry;

        // increment counters
        unchecked {
            ++playerSubmissionCount[msg.sender];
            ++totalScoresSubmitted;
        }

        // check for new all-time high
        if (_score > allTimeHighScore) {
            allTimeHighScore = _score;
            championPlayer = msg.sender;
            emit NewChampion(msg.sender, _score, _level);
        }

        /* ---- insert into leaderboard ---- */
        uint8 len = leaderboardSize;
        uint64 effectiveScore = _score +
            (uint64(playerReferralCount[msg.sender]) * 100);

        // quick gate: reject if board full and worse than last slot
        if (len == MAX_LEADERBOARD_SIZE) {
            uint64 lastEffectiveScore = leaderboard[len - 1].score +
                (uint64(playerReferralCount[leaderboard[len - 1].player]) *
                    100);
            if (effectiveScore <= lastEffectiveScore) {
                emit ScoreSubmitted(
                    msg.sender,
                    _score,
                    _level,
                    uint64(block.timestamp)
                );
                return;
            }
        }

        // grow length if board not yet full
        if (len < MAX_LEADERBOARD_SIZE) {
            unchecked {
                leaderboardSize = len + 1;
            }
        }

        // walk backwards & shift based on effective score
        uint8 i = leaderboardSize - 1;
        while (i > 0) {
            uint64 prevEffectiveScore = leaderboard[i - 1].score +
                (uint64(playerReferralCount[leaderboard[i - 1].player]) * 100);
            if (prevEffectiveScore >= effectiveScore) break;
            leaderboard[i] = leaderboard[i - 1];
            unchecked {
                --i;
            }
        }
        leaderboard[i] = newEntry;

        emit ScoreSubmitted(
            msg.sender,
            _score,
            _level,
            uint64(block.timestamp)
        );
    }

    /* ----------  Read Functions  ---------- */

    /// @notice  Paginate through the ordered leaderboard.
    /// @param   start     zero-based cursor
    /// @param   howMany   max records to return (suggest ≤20)
    function getPage(
        uint256 start,
        uint256 howMany
    ) external view returns (ScoreEntry[] memory page) {
        uint256 end = start + howMany;
        uint256 size = leaderboardSize;

        if (start >= size) return new ScoreEntry[](0);
        if (end > size) end = size;

        uint256 len = end - start;
        page = new ScoreEntry[](len);

        for (uint256 j = 0; j < len; ++j) {
            page[j] = leaderboard[start + j];
        }
    }

    /// @notice Convenience helper: top 20 snapshot.
    function getTop20() external view returns (ScoreEntry[] memory top) {
        uint8 cap = leaderboardSize > 20 ? 20 : leaderboardSize;
        top = new ScoreEntry[](cap);
        for (uint8 k = 0; k < cap; ++k) top[k] = leaderboard[k];
    }

    /// @notice Get your personal best score and submission count.
    /// @param player The address to query (use msg.sender for yourself)
    /// @return bestScore Your highest score (0 if no scores submitted)
    /// @return totalSubmissions Total number of score submissions
    /// @return referralCount Number of players you have referred
    function getMyStats(
        address player
    )
        external
        view
        returns (
            uint64 bestScore,
            uint32 totalSubmissions,
            uint32 referralCount
        )
    {
        ScoreEntry memory best = playerBest[player];
        bestScore = best.score;
        totalSubmissions = playerSubmissionCount[player];
        referralCount = playerReferralCount[player];
    }

    /* ----------  NEW UTILITY FUNCTIONS  ---------- */

    /// @notice Find a player's current rank on the leaderboard (1-indexed, 0 = not on board)
    /// @param player The address to look for
    /// @return rank Position on leaderboard (1 = first place, 0 = not ranked)
    function getPlayerRank(address player) external view returns (uint8 rank) {
        for (uint8 i = 0; i < leaderboardSize; ++i) {
            if (leaderboard[i].player == player) {
                return i + 1; // 1-indexed
            }
        }
        return 0; // not found
    }

    /// @notice Get scores around a specific rank for context
    /// @param centerRank The rank to center around (1-indexed)
    /// @param radius How many entries above/below to include
    /// @return entries Array of score entries around the specified rank
    function getScoresAroundRank(
        uint8 centerRank,
        uint8 radius
    ) external view returns (ScoreEntry[] memory entries) {
        if (centerRank == 0 || centerRank > leaderboardSize) {
            return new ScoreEntry[](0);
        }

        uint8 start = centerRank > radius + 1 ? centerRank - radius - 1 : 0;
        uint8 end = centerRank + radius > leaderboardSize
            ? leaderboardSize
            : centerRank + radius;

        uint8 len = end - start;
        entries = new ScoreEntry[](len);

        for (uint8 i = 0; i < len; ++i) {
            entries[i] = leaderboard[start + i];
        }
    }

    /// @notice Get comprehensive game statistics
    /// @return highScore All-time highest score achieved
    /// @return champion Address of the current champion
    /// @return totalSubmissions Total scores submitted by all players
    /// @return uniquePlayers Number of unique players (approximation via leaderboard size)
    /// @return averageTopScore Average of current top 10 scores
    function getGameStats()
        external
        view
        returns (
            uint64 highScore,
            address champion,
            uint64 totalSubmissions,
            uint8 uniquePlayers,
            uint64 averageTopScore
        )
    {
        highScore = allTimeHighScore;
        champion = championPlayer;
        totalSubmissions = totalScoresSubmitted;
        uniquePlayers = leaderboardSize;

        // Calculate average of top 10 (or all if less than 10)
        uint8 topCount = leaderboardSize > 10 ? 10 : leaderboardSize;
        if (topCount > 0) {
            uint256 sum = 0;
            for (uint8 i = 0; i < topCount; ++i) {
                sum += leaderboard[i].score;
            }
            averageTopScore = uint64(sum / topCount);
        }
    }

    /// @notice Check if a score would make it onto the leaderboard
    /// @param score The score to check
    /// @param playerAddress The player's address (to calculate their effective score with referrals)
    /// @return wouldMakeIt True if score would be accepted
    /// @return estimatedRank Estimated rank it would achieve (0 if wouldn't make it)
    function wouldScoreMakeLeaderboard(
        uint64 score,
        address playerAddress
    ) external view returns (bool wouldMakeIt, uint8 estimatedRank) {
        uint64 effectiveScore = score +
            (uint64(playerReferralCount[playerAddress]) * 100);

        // If board isn't full, any valid score makes it
        if (leaderboardSize < MAX_LEADERBOARD_SIZE) {
            wouldMakeIt = true;
        } else {
            // Check if better than worst effective score on full board
            uint64 lastEffectiveScore = leaderboard[leaderboardSize - 1].score +
                (uint64(
                    playerReferralCount[leaderboard[leaderboardSize - 1].player]
                ) * 100);
            wouldMakeIt = effectiveScore > lastEffectiveScore;
        }

        if (!wouldMakeIt) return (false, 0);

        // Find where it would rank based on effective score
        for (uint8 i = 0; i < leaderboardSize; ++i) {
            uint64 currentEffectiveScore = leaderboard[i].score +
                (uint64(playerReferralCount[leaderboard[i].player]) * 100);
            if (effectiveScore > currentEffectiveScore) {
                return (true, i + 1);
            }
        }

        // If we get here, it goes at the end
        return (true, leaderboardSize + 1);
    }

    /// @notice Get recent activity (last N submissions from leaderboard)
    /// @param count Number of recent entries to return
    /// @return recent Array of recent score entries, sorted by timestamp desc
    function getRecentActivity(
        uint8 count
    ) external view returns (ScoreEntry[] memory recent) {
        if (count == 0 || leaderboardSize == 0) {
            return new ScoreEntry[](0);
        }

        uint8 actualCount = count > leaderboardSize ? leaderboardSize : count;

        // Create array of all entries with timestamps
        ScoreEntry[] memory temp = new ScoreEntry[](leaderboardSize);
        for (uint8 i = 0; i < leaderboardSize; ++i) {
            temp[i] = leaderboard[i];
        }

        // Simple bubble sort by timestamp (desc) - acceptable for small arrays
        for (uint8 i = 0; i < leaderboardSize - 1; ++i) {
            for (uint8 j = 0; j < leaderboardSize - i - 1; ++j) {
                if (temp[j].timestamp < temp[j + 1].timestamp) {
                    ScoreEntry memory swap = temp[j];
                    temp[j] = temp[j + 1];
                    temp[j + 1] = swap;
                }
            }
        }

        recent = new ScoreEntry[](actualCount);
        for (uint8 k = 0; k < actualCount; ++k) {
            recent[k] = temp[k];
        }
    }

    /// @notice Get level-based statistics
    /// @param targetLevel The level to analyze
    /// @return playerCount Number of players who reached this level
    /// @return highestScore Highest score achieved at this level
    /// @return averageScore Average score for this level
    function getLevelStats(
        uint32 targetLevel
    )
        external
        view
        returns (uint32 playerCount, uint64 highestScore, uint64 averageScore)
    {
        uint256 sum = 0;

        for (uint8 i = 0; i < leaderboardSize; ++i) {
            if (leaderboard[i].level >= targetLevel) {
                playerCount++;
                sum += leaderboard[i].score;
                if (leaderboard[i].score > highestScore) {
                    highestScore = leaderboard[i].score;
                }
            }
        }

        if (playerCount > 0) {
            averageScore = uint64(sum / playerCount);
        }
    }

    /* ----------  REFERRAL FUNCTIONS  ---------- */

    /// @notice Get a player's referral count
    /// @param player The address to query
    /// @return count Number of players referred by this address
    function getReferralCount(
        address player
    ) external view returns (uint32 count) {
        return playerReferralCount[player];
    }

    /// @notice Calculate effective leaderboard score (score + 100 * referrals)
    /// @param player The address to calculate for
    /// @return effectiveScore The combined score used for leaderboard ranking
    function getEffectiveScore(
        address player
    ) external view returns (uint64 effectiveScore) {
        ScoreEntry memory best = playerBest[player];
        return best.score + (uint64(playerReferralCount[player]) * 100);
    }
}
