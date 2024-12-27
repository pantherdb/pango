
import type React from 'react';
import { IconButton, Button } from '@mui/material';
import { Bookmark, PlayArrow, PersonOutline, Favorite, Style } from '@mui/icons-material';
import { capitalize, generateColorFromText } from '@/@pango.core/utils/utils';
import type { Annotation } from '../models/annotation';
import { Link } from 'react-router-dom';

interface ColorizeImageProps {
  name?: string;
  color: string;
  fit?: 'contain' | 'cover' | 'fill' | 'none' | 'scale-down';
  className?: string;
}

const ColorizeImage: React.FC<ColorizeImageProps> = ({
  name,
  color,
  fit = 'cover',
  className = ''
}) => {
  if (!name) {
    return <div className={className} />;
  }

  const handleError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    const img = e.target as HTMLImageElement;
    img.style.display = 'none';
  };

  // Convert color to rgba
  const rgba = `rgba(${parseInt(color.slice(1, 3), 16)}, ${parseInt(color.slice(3, 5), 16)}, ${parseInt(color.slice(5, 7), 16)}, 0.6)`;

  return (
    <div className={`relative ${className}`}>
      <img
        src={`/assets/images/annotations/${name}.png`}
        onError={handleError}
        style={{ objectFit: fit }}
        className="w-full h-full"
        alt=""
      />
      <div
        className="absolute inset-0"
        style={{
          backgroundColor: rgba
        }}
      />
    </div>
  );
};


interface AnnotationThinProps {
  annotation: Annotation;
  onBookmark?: (annotationId: string, type: 'like' | 'bookmark') => void;
}

const AnnotationThin: React.FC<AnnotationThinProps> = ({
  annotation,
  onBookmark
}) => {
  const backgroundColor = generateColorFromText(annotation.title)
  return (
    <div className="relative overflow-hidden w-full h-full rounded-xl">
      <div
        className="w-full h-full"
        style={{ backgroundColor: backgroundColor }}
      >
        <div className="absolute left-0 right-0 top-0 h-[150px]">
          <ColorizeImage
            name={annotation.sectionCategory}
            color={backgroundColor}
            fit="cover"
            className="w-full h-full"
          />
        </div>
        <div className="absolute right-0 top-0">
          <img
            src={`/assets/images/core/png/pango-${annotation.category}.png`}
            alt={annotation.category}
            className="h-16 w-16 opacity-20"
          />
        </div>
        <div
          className="absolute inset-0"
          style={{
            background: 'linear-gradient(to bottom, rgba(0,0,0,0.3) 0%, rgba(0,0,0,0.7) 100%)'
          }}
        />
        <div className="relative p-2.5 pb-2.5 flex flex-col h-full">
          {/* Header Row */}
          <div className="pt-2.5 flex items-center">
            <span className="text-white text-xl">
              {capitalize(annotation.category)}
            </span>
            <div className="flex-grow" />
            <IconButton
              size="small"
              onClick={() => onBookmark?.(annotation._id, 'like')}
              className="text-white w-7.5"
            >
              <Favorite sx={{ fontSize: 15 }} />
            </IconButton>
            <IconButton
              size="small"
              onClick={() => onBookmark?.(annotation._id, 'bookmark')}
              className="text-white w-7.5"
            >
              <Bookmark sx={{ fontSize: 18 }} />
            </IconButton>
          </div>
          <div className="h-5 flex items-center mt-1">
            <PersonOutline className="text-white" sx={{ fontSize: 12 }} />
            <span className="ml-0.5 text-white text-xs truncate">
              {`${annotation.owner?.firstName || ''} ${annotation.owner?.lastName || ''}`}
            </span>
          </div>
          <div className="flex-grow flex flex-col justify-end">
            <p className="text-white text-sm mb-2">
              {annotation.title}
            </p>
          </div>
          <div className="flex items-center h-12 mt-2">
            <Button
              variant="outlined"
              size="small"
              startIcon={<Style />}
              className="text-white border-white hover:bg-white/10"
            >
              {`${annotation.descendants} Annotations`}
            </Button>
            <div className="flex-grow" />
            <Link to={`/annotations/${annotation._id}`} style={{ textDecoration: 'none' }}>
              <Button
                variant="contained"
                className="!min-w-[30px] !w-[30px] h-[30px] rounded-full"
                style={{ backgroundColor: '#6ABE70' }}
              >
                <PlayArrow />
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnnotationThin;