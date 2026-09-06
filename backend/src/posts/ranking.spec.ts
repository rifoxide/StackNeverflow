import { describe, it, expect } from 'vitest';

/**
 * Isolated tests for the post ranking formula.
 * Formula: rankScore = (likesCount - dislikesCount) + (commentCount * 2)
 *
 * These tests verify edge cases and ensure the formula behaves correctly
 * across various scenarios without requiring the full PostsService.
 */

describe('Post Ranking Formula', () => {
  const calculateRankScore = (
    likesCount: number,
    dislikesCount: number,
    commentCount: number,
  ): number => {
    return likesCount - dislikesCount + commentCount * 2;
  };

  describe('basic scenarios', () => {
    it('should handle all zeros', () => {
      expect(calculateRankScore(0, 0, 0)).toBe(0);
    });

    it('should calculate correctly with only likes', () => {
      expect(calculateRankScore(10, 0, 0)).toBe(10);
    });

    it('should calculate correctly with only dislikes', () => {
      expect(calculateRankScore(0, 5, 0)).toBe(-5);
    });

    it('should calculate correctly with only comments', () => {
      expect(calculateRankScore(0, 0, 3)).toBe(6);
    });
  });

  describe('combined scenarios', () => {
    it('should prioritize comments over likes (weight of 2)', () => {
      const scoreWithLikes = calculateRankScore(5, 0, 0);
      const scoreWithComments = calculateRankScore(0, 0, 3);
      expect(scoreWithComments).toBeGreaterThan(scoreWithLikes);
    });

    it('should calculate correctly with all positive counts', () => {
      // (10 - 2) + (5 * 2) = 8 + 10 = 18
      expect(calculateRankScore(10, 2, 5)).toBe(18);
    });

    it('should handle negative net reactions with comments', () => {
      // (2 - 10) + (3 * 2) = -8 + 6 = -2
      expect(calculateRankScore(2, 10, 3)).toBe(-2);
    });

    it('should handle equal likes and dislikes', () => {
      // (5 - 5) + (2 * 2) = 0 + 4 = 4
      expect(calculateRankScore(5, 5, 2)).toBe(4);
    });
  });

  describe('edge cases', () => {
    it('should handle large numbers', () => {
      // (1000 - 100) + (500 * 2) = 900 + 1000 = 1900
      expect(calculateRankScore(1000, 100, 500)).toBe(1900);
    });

    it('should handle heavily disliked posts', () => {
      // (5 - 100) + (0 * 2) = -95
      expect(calculateRankScore(5, 100, 0)).toBe(-95);
    });

    it('should handle posts with many comments but negative reactions', () => {
      // (10 - 50) + (100 * 2) = -40 + 200 = 160
      expect(calculateRankScore(10, 50, 100)).toBe(160);
    });

    it('should handle single like', () => {
      expect(calculateRankScore(1, 0, 0)).toBe(1);
    });

    it('should handle single dislike', () => {
      expect(calculateRankScore(0, 1, 0)).toBe(-1);
    });

    it('should handle single comment', () => {
      expect(calculateRankScore(0, 0, 1)).toBe(2);
    });
  });

  describe('comparison scenarios', () => {
    it('should rank post with 3 likes higher than post with 1 comment', () => {
      const postWithLikes = calculateRankScore(3, 0, 0);
      const postWithComment = calculateRankScore(0, 0, 1);
      expect(postWithLikes).toBeGreaterThan(postWithComment);
    });

    it('should rank post with 2 comments higher than post with 3 likes', () => {
      const postWithComments = calculateRankScore(0, 0, 2);
      const postWithLikes = calculateRankScore(3, 0, 0);
      expect(postWithComments).toBeGreaterThan(postWithLikes);
    });

    it('should rank controversial post with many comments high', () => {
      const controversial = calculateRankScore(50, 50, 20); // 0 + 40 = 40
      const onlyLikes = calculateRankScore(30, 0, 0); // 30
      expect(controversial).toBeGreaterThan(onlyLikes);
    });

    it('should rank quiet but liked post lower than engaged post', () => {
      const quiet = calculateRankScore(10, 0, 0); // 10
      const engaged = calculateRankScore(5, 2, 5); // 3 + 10 = 13
      expect(engaged).toBeGreaterThan(quiet);
    });
  });

  describe('tie-breaking scenarios', () => {
    it('should produce same score for equivalent engagement patterns', () => {
      // Multiple ways to get score of 10
      expect(calculateRankScore(10, 0, 0)).toBe(10);
      expect(calculateRankScore(0, 0, 5)).toBe(10);
      expect(calculateRankScore(6, 0, 2)).toBe(10);
      expect(calculateRankScore(14, 4, 0)).toBe(10);
    });

    it('should produce same score for negative equivalent patterns', () => {
      // Multiple ways to get score of -5
      expect(calculateRankScore(0, 5, 0)).toBe(-5);
      expect(calculateRankScore(5, 10, 0)).toBe(-5);
      expect(calculateRankScore(0, 7, 1)).toBe(-5);
    });
  });

  describe('realistic scenarios', () => {
    it('should calculate score for viral post', () => {
      // Viral: 500 likes, 20 dislikes, 150 comments
      // (500 - 20) + (150 * 2) = 480 + 300 = 780
      expect(calculateRankScore(500, 20, 150)).toBe(780);
    });

    it('should calculate score for unpopular post', () => {
      // Unpopular: 2 likes, 0 dislikes, 0 comments
      expect(calculateRankScore(2, 0, 0)).toBe(2);
    });

    it('should calculate score for controversial post', () => {
      // Controversial: 100 likes, 95 dislikes, 50 comments
      // (100 - 95) + (50 * 2) = 5 + 100 = 105
      expect(calculateRankScore(100, 95, 50)).toBe(105);
    });

    it('should calculate score for question post with discussion', () => {
      // Question: 15 likes, 1 dislike, 30 comments
      // (15 - 1) + (30 * 2) = 14 + 60 = 74
      expect(calculateRankScore(15, 1, 30)).toBe(74);
    });
  });
});
