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

    struct EffectiveScoreEntry {
        address player;
        uint64 rawScore;
        uint64 effectiveScore; // rawScore + (referrals * 100)
        uint32 level;
        uint64 timestamp;
        uint32 referralCount;
    }

    uint8 public constant MAX_LEADERBOARD_SIZE = 100;
    uint8 public constant BATCH_SIZE = 10; // Process leaderboard in smaller batches

    /* Mapping: every wallet → its personal best */
    mapping(address => ScoreEntry) public playerBest;

    /* Mapping: every wallet → total submission count */
    mapping(address => uint32) public playerSubmissionCount;

    /* Mapping: every wallet → referral count (how many people they referred) */
    mapping(address => uint32) public playerReferralCount;

    /* Unsorted array of top scores - we sort on read, not write */
    ScoreEntry[MAX_LEADERBOARD_SIZE] private topScores;
    uint8 public topScoresCount; // current filled length

    /* Cached sorted leaderboard - updated lazily */
    ScoreEntry[MAX_LEADERBOARD_SIZE] private cachedLeaderboard;
    uint8 public cachedLeaderboardSize;
    bool public leaderboardNeedsUpdate;

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

        // Create new entry
        ScoreEntry memory newEntry = ScoreEntry({
            player: msg.sender,
            score: _score,
            level: _level,
            timestamp: uint64(block.timestamp)
        });

        // Update personal best
        playerBest[msg.sender] = newEntry;

        // Increment counters
        unchecked {
            ++playerSubmissionCount[msg.sender];
            ++totalScoresSubmitted;
        }

        // Check for new all-time high
        if (_score > allTimeHighScore) {
            allTimeHighScore = _score;
            championPlayer = msg.sender;
            emit NewChampion(msg.sender, _score, _level);
        }

        // Add to top scores using simple replacement strategy
        _addToTopScores(newEntry);

        emit ScoreSubmitted(
            msg.sender,
            _score,
            _level,
            uint64(block.timestamp)
        );
    }

    /// @notice Internal function to add score to top scores array
    function _addToTopScores(ScoreEntry memory newEntry) private {
        uint64 effectiveScore = newEntry.score +
            (uint64(playerReferralCount[newEntry.player]) * 100);

        // If array isn't full, just add it
        if (topScoresCount < MAX_LEADERBOARD_SIZE) {
            topScores[topScoresCount] = newEntry;
            unchecked {
                ++topScoresCount;
            }
            leaderboardNeedsUpdate = true;
            return;
        }

        // Find the worst score in current top scores
        uint8 worstIndex = 0;
        uint64 worstEffectiveScore = topScores[0].score +
            (uint64(playerReferralCount[topScores[0].player]) * 100);

        for (uint8 i = 1; i < MAX_LEADERBOARD_SIZE; ++i) {
            uint64 currentEffective = topScores[i].score +
                (uint64(playerReferralCount[topScores[i].player]) * 100);
            if (currentEffective < worstEffectiveScore) {
                worstEffectiveScore = currentEffective;
                worstIndex = i;
            }
        }

        // Replace worst score if new score is better
        if (effectiveScore > worstEffectiveScore) {
            topScores[worstIndex] = newEntry;
            leaderboardNeedsUpdate = true;
        }
    }

    /// @notice Update the cached sorted leaderboard
    function updateLeaderboard() external {
        if (!leaderboardNeedsUpdate) return;

        _sortLeaderboard();
        leaderboardNeedsUpdate = false;
    }

    /// @notice Internal sorting function using insertion sort (efficient for small arrays)
    function _sortLeaderboard() private {
        // Copy topScores to cachedLeaderboard
        for (uint8 i = 0; i < topScoresCount; ++i) {
            cachedLeaderboard[i] = topScores[i];
        }
        cachedLeaderboardSize = topScoresCount;

        // Insertion sort by effective score (descending)
        for (uint8 i = 1; i < cachedLeaderboardSize; ++i) {
            ScoreEntry memory key = cachedLeaderboard[i];
            uint64 keyEffective = key.score +
                (uint64(playerReferralCount[key.player]) * 100);

            uint8 j = i;
            while (j > 0) {
                uint64 prevEffective = cachedLeaderboard[j - 1].score +
                    (uint64(
                        playerReferralCount[cachedLeaderboard[j - 1].player]
                    ) * 100);
                if (prevEffective >= keyEffective) break;

                cachedLeaderboard[j] = cachedLeaderboard[j - 1];
                unchecked {
                    --j;
                }
            }
            cachedLeaderboard[j] = key;
        }
    }

    /// @notice Auto-update leaderboard if needed (gas-limited)
    function _ensureLeaderboardUpdated() private {
        if (leaderboardNeedsUpdate) {
            _sortLeaderboard();
            leaderboardNeedsUpdate = false;
        }
    }

    /* ----------  Read Functions  ---------- */

    /// @notice  Paginate through the ordered leaderboard.
    /// @param   start     zero-based cursor
    /// @param   howMany   max records to return (suggest ≤20)
    function getPage(
        uint256 start,
        uint256 howMany
    ) external returns (ScoreEntry[] memory page) {
        _ensureLeaderboardUpdated();

        uint256 end = start + howMany;
        uint256 size = cachedLeaderboardSize;

        if (start >= size) return new ScoreEntry[](0);
        if (end > size) end = size;

        uint256 len = end - start;
        page = new ScoreEntry[](len);

        for (uint256 j = 0; j < len; ++j) {
            page[j] = cachedLeaderboard[start + j];
        }
    }

    /// @notice Convenience helper: top 20 snapshot with effective scores.
    function getTop20() external returns (EffectiveScoreEntry[] memory top) {
        _ensureLeaderboardUpdated();
        uint8 cap = cachedLeaderboardSize > 20 ? 20 : cachedLeaderboardSize;
        top = new EffectiveScoreEntry[](cap);

        for (uint8 k = 0; k < cap; ++k) {
            ScoreEntry memory entry = cachedLeaderboard[k];
            uint32 referrals = playerReferralCount[entry.player];
            uint64 effective = entry.score + (uint64(referrals) * 100);

            top[k] = EffectiveScoreEntry({
                player: entry.player,
                rawScore: entry.score,
                effectiveScore: effective,
                level: entry.level,
                timestamp: entry.timestamp,
                referralCount: referrals
            });
        }
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

    /* ----------  UTILITY FUNCTIONS  ---------- */

    /// @notice Find a player's current rank on the leaderboard (1-indexed, 0 = not on board)
    /// @param player The address to look for
    /// @return rank Position on leaderboard (1 = first place, 0 = not ranked)
    function getPlayerRank(address player) external returns (uint8 rank) {
        _ensureLeaderboardUpdated();
        for (uint8 i = 0; i < cachedLeaderboardSize; ++i) {
            if (cachedLeaderboard[i].player == player) {
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
    ) external returns (ScoreEntry[] memory entries) {
        _ensureLeaderboardUpdated();

        if (centerRank == 0 || centerRank > cachedLeaderboardSize) {
            return new ScoreEntry[](0);
        }

        uint8 start = centerRank > radius + 1 ? centerRank - radius - 1 : 0;
        uint8 end = centerRank + radius > cachedLeaderboardSize
            ? cachedLeaderboardSize
            : centerRank + radius;

        uint8 len = end - start;
        entries = new ScoreEntry[](len);

        for (uint8 i = 0; i < len; ++i) {
            entries[i] = cachedLeaderboard[start + i];
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
        returns (
            uint64 highScore,
            address champion,
            uint64 totalSubmissions,
            uint8 uniquePlayers,
            uint64 averageTopScore
        )
    {
        _ensureLeaderboardUpdated();

        highScore = allTimeHighScore;
        champion = championPlayer;
        totalSubmissions = totalScoresSubmitted;
        uniquePlayers = cachedLeaderboardSize;

        // Calculate average of top 10 (or all if less than 10)
        uint8 topCount = cachedLeaderboardSize > 10
            ? 10
            : cachedLeaderboardSize;
        if (topCount > 0) {
            uint256 sum = 0;
            for (uint8 i = 0; i < topCount; ++i) {
                sum += cachedLeaderboard[i].score;
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
        if (topScoresCount < MAX_LEADERBOARD_SIZE) {
            wouldMakeIt = true;
        } else {
            // Find worst effective score in current top scores
            uint64 worstEffective = type(uint64).max;
            for (uint8 i = 0; i < MAX_LEADERBOARD_SIZE; ++i) {
                uint64 currentEffective = topScores[i].score +
                    (uint64(playerReferralCount[topScores[i].player]) * 100);
                if (currentEffective < worstEffective) {
                    worstEffective = currentEffective;
                }
            }
            wouldMakeIt = effectiveScore > worstEffective;
        }

        if (!wouldMakeIt) return (false, 0);

        // Find where it would rank based on effective score in cached leaderboard
        for (uint8 i = 0; i < cachedLeaderboardSize; ++i) {
            uint64 currentEffectiveScore = cachedLeaderboard[i].score +
                (uint64(playerReferralCount[cachedLeaderboard[i].player]) *
                    100);
            if (effectiveScore > currentEffectiveScore) {
                return (true, i + 1);
            }
        }

        // If we get here, it goes at the end
        return (true, cachedLeaderboardSize + 1);
    }

    /// @notice Get recent activity (last N submissions from leaderboard)
    /// @param count Number of recent entries to return
    /// @return recent Array of recent score entries, sorted by timestamp desc
    function getRecentActivity(
        uint8 count
    ) external view returns (ScoreEntry[] memory recent) {
        if (count == 0 || topScoresCount == 0) {
            return new ScoreEntry[](0);
        }

        uint8 actualCount = count > topScoresCount ? topScoresCount : count;

        // Create array of all entries with timestamps
        ScoreEntry[] memory temp = new ScoreEntry[](topScoresCount);
        for (uint8 i = 0; i < topScoresCount; ++i) {
            temp[i] = topScores[i];
        }

        // Simple bubble sort by timestamp (desc) - acceptable for small arrays
        for (uint8 i = 0; i < topScoresCount - 1; ++i) {
            for (uint8 j = 0; j < topScoresCount - i - 1; ++j) {
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

        for (uint8 i = 0; i < topScoresCount; ++i) {
            if (topScores[i].level >= targetLevel) {
                playerCount++;
                sum += topScores[i].score;
                if (topScores[i].score > highestScore) {
                    highestScore = topScores[i].score;
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

    /* ----------  MAINTENANCE FUNCTIONS  ---------- */

    /// @notice Force a full leaderboard rebuild (can be called by anyone)
    function forceLeaderboardUpdate() external {
        _sortLeaderboard();
        leaderboardNeedsUpdate = false;
    }

    /// @notice Check if leaderboard needs updating
    /// @return needsUpdate Whether the cached leaderboard is stale
    function leaderboardStatus() external view returns (bool needsUpdate) {
        return leaderboardNeedsUpdate;
    }
}
