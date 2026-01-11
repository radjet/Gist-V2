import { Cluster } from '../../types';

const now = new Date();

export const mockClusters: Cluster[] = [
  {
    id: '1',
    title: 'Volcanic Eruption in Iceland',
    summary: 'A new fissure eruption has started on the Reykjanes peninsula, prompting evacuations in nearby Grindavík.',
    locationLabel: 'Reykjanes, Iceland',
    updatedAt: new Date(now.getTime() - 1000 * 60 * 30).toISOString(), // 30 mins ago
    breakingScore: 95,
  },
  {
    id: '2',
    title: 'Tech Summit 2024 Keynote',
    summary: 'Major AI advancements announced including new generative models for video and real-time translation.',
    locationLabel: 'San Francisco, CA',
    updatedAt: new Date(now.getTime() - 1000 * 60 * 120).toISOString(), // 2 hours ago
    breakingScore: 60,
  },
  {
    id: '3',
    title: 'Global Climate Accord Signed',
    summary: '150 nations agree to aggressive carbon reduction targets by 2030 in a historic summit.',
    locationLabel: 'Geneva, Switzerland',
    updatedAt: new Date(now.getTime() - 1000 * 60 * 60 * 5).toISOString(), // 5 hours ago
    breakingScore: 88,
  },
  {
    id: '4',
    title: 'Stock Markets Hit All-Time High',
    summary: 'Tech rally pushes S&P 500 to record levels amidst falling inflation data.',
    locationLabel: 'New York, NY',
    updatedAt: new Date(now.getTime() - 1000 * 60 * 45).toISOString(), // 45 mins ago
    breakingScore: 75,
  },
  {
    id: '5',
    title: 'Typhoon Mawar Approaches Coast',
    summary: 'Category 4 storm expected to make landfall within 24 hours. Emergency services on high alert.',
    locationLabel: 'Manila, Philippines',
    updatedAt: new Date(now.getTime() - 1000 * 60 * 15).toISOString(), // 15 mins ago
    breakingScore: 92,
  },
  {
    id: '6',
    title: 'Mars Sample Return Mission Launch',
    summary: 'Space agency successfully launches rocket to retrieve geological samples from the Red Planet.',
    locationLabel: 'Cape Canaveral, FL',
    updatedAt: new Date(now.getTime() - 1000 * 60 * 60 * 24).toISOString(), // 1 day ago
    breakingScore: 80,
  },
  {
    id: '7',
    title: 'New Archaeopteryx Fossil Found',
    summary: 'Paleontologists discover pristine specimen shedding light on the evolution of bird flight.',
    locationLabel: 'Bavaria, Germany',
    updatedAt: new Date(now.getTime() - 1000 * 60 * 60 * 48).toISOString(), // 2 days ago
    breakingScore: 45,
  },
  {
    id: '8',
    title: 'Ocean Cleanup Milestone',
    summary: 'Non-profit announces removal of 100,000kg of plastic from the Great Pacific Garbage Patch.',
    locationLabel: 'Pacific Ocean',
    updatedAt: new Date(now.getTime() - 1000 * 60 * 60 * 3).toISOString(), // 3 hours ago
    breakingScore: 55,
  },
];