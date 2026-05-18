import React from 'react';
import { Lightbulb, Share2 } from 'lucide-react';
import { Typography } from '@/components/theme';
import { RoadmapTimeline, RoadmapStep } from '@/components/organisms/RoadmapTimeline';
import ProgressBar from '@/components/atoms/ProgressBar';

export const RoadmapHomeView: React.FC = () => {
  const mockSteps: RoadmapStep[] = [
    {
      id: '1',
      title: 'Section 1',
      description: 'The technical task is attached as a file .doc Please read it carefully and follow the instru...',
      tags: ['#biology', '#biology'],
      isCompleted: true,
    },
    {
      id: '2',
      title: 'Section 2',
      description: 'The technical task is attached as a file .doc Please read it carefully and follow the instru...',
      tags: ['#biology', '#biology'],
      isCompleted: true,
    },
    {
      id: '3',
      title: 'Section 3',
      description: 'The technical task is attached as a file .doc Please read it carefully and follow the instru...',
      tags: ['#biology', '#biology'],
      isCompleted: false,
    },
    {
      id: '4',
      title: 'Section 4',
      description: 'The technical task is attached as a file .doc Please read it carefully and follow the instru...',
      tags: ['#biology', '#biology'],
      isCompleted: false,
    },
    {
      id: '5',
      title: 'Section 5',
      description: 'The technical task is attached as a file .doc Please read it carefully and follow the instru...',
      tags: ['#biology', '#biology'],
      isCompleted: false,
    },
  ];

  return (
    <div className="flex flex-col gap-10">
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <Typography variant="h1" className="text-[32px] font-bold text-[#174A5F]">
            Physics Roadmap
          </Typography>

          <div className="flex items-center gap-8">
            <button className="flex items-center gap-3 group">
              <div className="w-10 h-10 rounded-full border border-[#174A5F]/10 flex items-center justify-center bg-white group-hover:bg-[#174A5F]/5 transition-colors">
                <Lightbulb className="h-5 w-5 text-[#174A5F]" />
              </div>
              <Typography className="text-sm font-bold text-[#174A5F]">
                Master
              </Typography>
            </button>

            <button className="flex items-center gap-3 group">
              <div className="w-10 h-10 rounded-full border border-[#174A5F]/10 flex items-center justify-center bg-white group-hover:bg-[#174A5F]/5 transition-colors">
                <Share2 className="h-5 w-5 text-[#174A5F]" />
              </div>
              <Typography className="text-sm font-bold text-[#174A5F]">
                Convert to Super
              </Typography>
            </button>

            <button className="h-[44px] px-8 bg-[#174A5F] rounded-lg text-white font-bold text-[13px] hover:bg-[#133e50] transition-all shadow-lg">
              Adjust Roadmap
            </button>
          </div>
        </div>

        <div className="max-w-[440px] space-y-4">
          <Typography className="text-[15px] font-bold text-[#174A5F]">
            Plan to learn All courses
          </Typography>
          
          <ProgressBar progress={5} label="Progress According to physics roadmap" />
        </div>
      </div>

      <div className="py-10">
        <RoadmapTimeline steps={mockSteps} />
      </div>
    </div>
  );
};

export default RoadmapHomeView;
