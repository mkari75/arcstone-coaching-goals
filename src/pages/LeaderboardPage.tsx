import { Leaderboard } from '@/components/gamification/Leaderboard';
import { AchievementBadges } from '@/components/gamification/AchievementBadges';
import { CelebrationFeed } from '@/components/gamification/CelebrationFeed';

const LeaderboardPage = () => {
  return (
    <div className="space-y-8 animate-fade-in">
      <Leaderboard />
      <AchievementBadges />
      <CelebrationFeed />
    </div>
  );
};

export default LeaderboardPage;
