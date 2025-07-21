// SPDX-License-Identifier: MIT
pragma solidity ^0.8.21;

/// @title Gas-Optimised Starship Troopers Leaderboard
/// @author  Open-Source Community
contract StarshipTroopersLeaderboard {
    /* ----------  Errors  ---------- */
    error InvalidInput();            // score==0 || level==0
    error NotHigherScore();          // new score ≤ current best

    /* ----------  Data Model  ---------- */
    struct ScoreEntry {
        address player;      // 20 bytes
        uint64  score;       // 8 bytes
        uint32  level;       // 4 bytes
        uint64  timestamp;   // 8 bytes
    } // 40 bytes → 1 storage slot

    uint8  public constant MAX_LEADERBOARD_SIZE = 100;

    /* Mapping: every wallet → its personal best */
    mapping(address => ScoreEntry) public playerBest;

    /* Fixed-size array: global top-100 (sorted desc) */
    ScoreEntry[MAX_LEADERBOARD_SIZE] private leaderboard;
    uint8 public leaderboardSize; // current filled length

    /* ----------  Events  ---------- */
    event ScoreSubmitted(
        address indexed player,
        uint64  score,
        uint32  level,
        uint64  timestamp
    );

    /* ----------  Write Function  ---------- */
    function submitScore(
        uint64  _score,
        uint32  _level
    ) external {
        if (_score == 0 || _level == 0) revert InvalidInput();

        ScoreEntry storage best = playerBest[msg.sender];
        if (_score <= best.score) revert NotHigherScore();

        // update personal best
        ScoreEntry memory newEntry = ScoreEntry({
            player:     msg.sender,
            score:      _score,
            level:      _level,
            timestamp:  uint64(block.timestamp)
        });
        playerBest[msg.sender] = newEntry;

        /* ---- insert into leaderboard ---- */
        uint8 len = leaderboardSize;

        // quick gate: reject if board full and worse than last slot
        if (len == MAX_LEADERBOARD_SIZE && 
            _score <= leaderboard[len - 1].score) {
            emit ScoreSubmitted(
                msg.sender, _score, _level, uint64(block.timestamp)
            );
            return;
        }

        // grow length if board not yet full
        if (len < MAX_LEADERBOARD_SIZE) {
            unchecked { leaderboardSize = len + 1; }
        }

        // walk backwards & shift
        uint8 i = leaderboardSize - 1;
        while (i > 0 && leaderboard[i - 1].score < _score) {
            leaderboard[i] = leaderboard[i - 1];
            unchecked { --i; }
        }
        leaderboard[i] = newEntry;

        emit ScoreSubmitted(
            msg.sender, _score, _level, uint64(block.timestamp)
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
        if (end   >  size) end = size;

        uint256 len = end - start;
        page = new ScoreEntry[](len);

        for (uint256 j=0; j < len; ++j) {
            page[j] = leaderboard[start + j];
        }
    }

    /// @notice Convenience helper: top 20 snapshot.
    function getTop20() external view returns (ScoreEntry[] memory top) {
        uint8 cap = leaderboardSize > 20 ? 20 : leaderboardSize;
        top = new ScoreEntry[](cap);
        for (uint8 k=0; k < cap; ++k) top[k] = leaderboard[k];
    }
}
