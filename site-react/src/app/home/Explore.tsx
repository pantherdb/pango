import { useState, useRef, useEffect } from 'react';
import {
  CircularProgress,
  IconButton,
  Typography,
  useMediaQuery,
  useTheme
} from '@mui/material';
import {
  ArrowForward,
  ChevronLeft,
  ChevronRight
} from '@mui/icons-material';
import { useGetAnnotationGroupsQuery } from '../annotations/annotationsApiSlice';
import { formatSectionName } from '@/@pango.core/utils/utils';
import type { Annotation, AnnotationGroup } from '../annotations/models/annotation';
import AnnotationThin from '../annotations/annotation/AnnotationThin';
import AvatarRow from '../profiles/AvatarRow';

interface ScrollControlsProps {
  onScrollLeft: () => void;
  onScrollRight: () => void;
  showLeft: boolean;
  showRight: boolean;
  isMobile: boolean;
}

const ScrollControls: React.FC<ScrollControlsProps> = ({
  onScrollLeft,
  onScrollRight,
  showLeft,
  showRight,
  isMobile
}) => {
  if (isMobile) return null;

  return (
    <>
      {showLeft && (
        <div className="absolute left-0 top-1/2 -translate-y-1/2 z-10">
          <IconButton
            onClick={onScrollLeft}
            className="bg-white shadow-lg hover:bg-gray-100"
          >
            <ChevronLeft />
          </IconButton>
        </div>
      )}
      {showRight && (
        <div className="absolute right-0 top-1/2 -translate-y-1/2 z-10">
          <IconButton
            onClick={onScrollRight}
            className="bg-white shadow-lg hover:bg-gray-100"
          >
            <ChevronRight />
          </IconButton>
        </div>
      )}
    </>
  );
};

interface AnnotationSectionProps {
  group: AnnotationGroup;
}

const AnnotationSection: React.FC<AnnotationSectionProps> = ({ group }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [showLeftScroll, setShowLeftScroll] = useState(false);
  const [showRightScroll, setShowRightScroll] = useState(false);
  const isScrollingRef = useRef(false);
  const scrollTimeout = useRef<NodeJS.Timeout>();

  const handleScroll = () => {
    if (scrollContainerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
      setShowLeftScroll(scrollLeft > 0);
      setShowRightScroll(scrollLeft < scrollWidth - clientWidth - 10);
    }
  };

  useEffect(() => {
    handleScroll();
    const resizeObserver = new ResizeObserver(handleScroll);
    if (scrollContainerRef.current) {
      resizeObserver.observe(scrollContainerRef.current);
    }
    return () => resizeObserver.disconnect();
  }, [group.annotations]);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const container = scrollContainerRef.current;
      const annotationWidth = isMobile ? 140 : 150;
      const gap = 12;
      const visibleWidth = container.clientWidth;
      const scrollAmount = Math.min(visibleWidth, (annotationWidth + gap) * (isMobile ? 1 : 2));

      container.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  const handleTouchStart = () => {
    isScrollingRef.current = false;
  };

  const handleTouchMove = () => {
    isScrollingRef.current = true;

    // Clear any existing timeout
    if (scrollTimeout.current) {
      clearTimeout(scrollTimeout.current);
    }
  };

  const handleTouchEnd = () => {
    // Set a timeout to reset the scrolling state
    scrollTimeout.current = setTimeout(() => {
      isScrollingRef.current = false;
    }, 100);
  };

  const handleOpenAnnotation = (annotationId: string) => {
    if (!isScrollingRef.current) {
      console.log('Opening annotation:', annotationId);
    }
  };

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (scrollTimeout.current) {
        clearTimeout(scrollTimeout.current);
      }
    };
  }, []);

  const getAnnotationWidth = () => isMobile ? 'w-[140px]' : 'w-[150px]';
  const getAnnotationHeight = () => isMobile ? 'h-[200px]' : 'h-[230px]';

  return (
    <div className={`mb-8 ${isMobile ? 'mb-4' : 'mb-12'}`}>
      <div className={`flex items-center justify-between px-4 ${isMobile ? 'h-10 mb-3' : 'h-12 mb-6'}`}>
        <Typography className={`text-gray-700 font-bold ${isMobile ? 'text-lg' : 'text-xl'}`}>
          {formatSectionName(group.name)}
        </Typography>
        <IconButton
          onClick={() => console.log('View more:', group.name)}
          size={isMobile ? "small" : "medium"}
          className="text-gray-600 hover:bg-gray-100"
        >
          <ArrowForward />
        </IconButton>
      </div>

      <div className="relative group">
        <ScrollControls
          onScrollLeft={() => scroll('left')}
          onScrollRight={() => scroll('right')}
          showLeft={showLeftScroll}
          showRight={showRightScroll}
          isMobile={isMobile}
        />
        <div
          ref={scrollContainerRef}
          className="flex overflow-x-auto scrollbar-hide scroll-smooth"
          onScroll={handleScroll}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          style={{
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
            WebkitOverflowScrolling: 'touch'
          }}
        >
          <div className={`flex gap-3 px-4 ${getAnnotationHeight()}`}>
            {group.annotations.map((annotation: Annotation) => (
              <div
                key={annotation._id}
                className={`${getAnnotationWidth()} h-full cursor-pointer transform transition-transform active:scale-95`}
                onClick={() => handleOpenAnnotation(annotation._id)}
              >
                <AnnotationThin annotation={annotation} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

const Explore: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const { data, error, isLoading } = useGetAnnotationGroupsQuery(10);
  const annotationGroups = data?.annotationGroups ?? [];

  return (
    <div className={`mx-auto ${isMobile ? "w-full" : "w-[1000px]"}`}>
      <div className="flex flex-col items-center justify-center mx-auto w-full">
        <AvatarRow />
      </div>

      <div className={`w-full ${isMobile ? 'p-2' : 'p-6'}`}>
        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <CircularProgress />
          </div>
        ) : error ? (
          <div className="text-center p-4 text-red-600">
            Error loading annotations
          </div>
        ) : (
          annotationGroups.map((group: AnnotationGroup, index: number) => (
            <AnnotationSection key={index} group={group} />
          ))
        )}
      </div>
    </div>
  );
};

export default Explore;