// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract StarshipTroopersLeaderboard {
    struct ScoreEntry {
        address player;
        uint256 score;
        uint256 level;
        uint256 timestamp;
        string discordUsername;
    }
    
    mapping(address => ScoreEntry) public playerBestScores;
    address[] public players;
    
    uint256 public constant MAX_LEADERBOARD_SIZE = 100;
    
    event ScoreSubmitted(address indexed player, uint256 score, uint256 level, uint256 timestamp, string discordUsername);
    
    function submitScore(uint256 _score, uint256 _level, string memory _discordUsername) external {
        require(_score > 0, "Score must be greater than 0");
        require(_level > 0, "Level must be greater than 0");
        
        // Check if this is a new player
        bool isNewPlayer = playerBestScores[msg.sender].score == 0;
        
        // Only update if it's a new high score for the player or new player
        require(_score > playerBestScores[msg.sender].score || isNewPlayer, "Score must be higher than current best");
        
        // Update player's best score
        playerBestScores[msg.sender] = ScoreEntry({
            player: msg.sender,
            score: _score,
            level: _level,
            timestamp: block.timestamp,
            discordUsername: _discordUsername
        });
        
        // Add to players array if new player
        if (isNewPlayer) {
            players.push(msg.sender);
        }
        
        emit ScoreSubmitted(msg.sender, _score, _level, block.timestamp, _discordUsername);
    }
    
    function getTopScores() external view returns (ScoreEntry[] memory) {
        ScoreEntry[] memory allScores = new ScoreEntry[](players.length);
        
        // Get all player scores
        for (uint256 i = 0; i < players.length; i++) {
            allScores[i] = playerBestScores[players[i]];
        }
        
        // Sort by score (bubble sort for simplicity)
        for (uint256 i = 0; i < allScores.length; i++) {
            for (uint256 j = 0; j < allScores.length - i - 1; j++) {
                if (allScores[j].score < allScores[j + 1].score) {
                    ScoreEntry memory temp = allScores[j];
                    allScores[j] = allScores[j + 1];
                    allScores[j + 1] = temp;
                }
            }
        }
        
        // Trim leaderboard if it exceeds max size
        if (allScores.length > MAX_LEADERBOARD_SIZE) {
            ScoreEntry[] memory trimmedScores = new ScoreEntry[](MAX_LEADERBOARD_SIZE);
            for (uint256 i = 0; i < MAX_LEADERBOARD_SIZE; i++) {
                trimmedScores[i] = allScores[i];
            }
            return trimmedScores;
        }
        
        return allScores;
    }
    
    function getPlayerBestScore(address _player) external view returns (uint256) {
        return playerBestScores[_player].score;
    }
    
    function getPlayerCount() external view returns (uint256) {
        return players.length;
    }
}
