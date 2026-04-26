import type { ArtifactType } from '../fleet/types';

export interface GtmStepDefinition {
  key: string;
  number: number;
  title: string;
  subtitle: string;
  artifactType: ArtifactType;
  dependsOn: string[];
}

export const gtmSteps: GtmStepDefinition[] = [
  {
    key: 'icp',
    number: 1,
    title: 'Ideal Customer Profile',
    subtitle: 'Who are you building for?',
    artifactType: 'icp-profile',
    dependsOn: [],
  },
  {
    key: 'positioning',
    number: 2,
    title: 'Positioning',
    subtitle: 'Why you vs. the alternatives?',
    artifactType: 'positioning',
    dependsOn: ['icp'],
  },
  {
    key: 'messaging',
    number: 3,
    title: 'Messaging',
    subtitle: 'What do you say and how?',
    artifactType: 'messaging',
    dependsOn: ['icp', 'positioning'],
  },
  {
    key: 'channels',
    number: 4,
    title: 'Channels',
    subtitle: 'Where do you reach them?',
    artifactType: 'channel-strategy',
    dependsOn: ['icp', 'positioning'],
  },
  {
    key: 'content',
    number: 5,
    title: 'Launch Content',
    subtitle: 'What do you publish?',
    artifactType: 'brief',
    dependsOn: ['messaging', 'channels'],
  },
  {
    key: 'outreach',
    number: 6,
    title: 'Outreach',
    subtitle: 'Who do you contact directly?',
    artifactType: 'network-analysis',
    dependsOn: ['icp', 'messaging'],
  },
  {
    key: 'launch-plan',
    number: 7,
    title: 'Launch Plan',
    subtitle: 'When and how do you execute?',
    artifactType: 'launch-plan',
    dependsOn: ['channels', 'content', 'outreach'],
  },
];

export function getStepByKey(key: string): GtmStepDefinition | undefined {
  return gtmSteps.find((s) => s.key === key);
}
