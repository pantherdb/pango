import type React from 'react';
import { useState } from 'react';
import { IconButton, Button, Menu, MenuItem, LinearProgress } from '@mui/material';
import { FaBars, FaGithub } from 'react-icons/fa';
import { Link } from 'react-router-dom';

interface ToolbarProps {
  openLeftDrawer: () => void;
  showLoadingBar?: boolean;
}

const Toolbar: React.FC<ToolbarProps> = ({ openLeftDrawer, showLoadingBar }) => {
  const [exportMenuAnchor, setExportMenuAnchor] = useState<null | HTMLElement>(null);

  const handleExportMenu = (event: React.MouseEvent<HTMLElement>) => {
    setExportMenuAnchor(event.currentTarget);
  };

  const handleCloseExportMenu = () => {
    setExportMenuAnchor(null);
  };

  return (
    <div className="fixed top-0 left-0 w-full h-[50px] bg-primary-500 text-accent-500 z-50">
      <div className="px-2 h-[50px] flex items-center relative">
        {showLoadingBar && (
          <div className="absolute top-0 left-0 right-0 w-full">
            <LinearProgress color="secondary" />
          </div>
        )}

        <IconButton
          color="inherit"
          onClick={openLeftDrawer}
          className="mr-2"
          size="large"
        >
          <FaBars />
        </IconButton>

        <div className="flex items-center h-full ">
          <Link to="/" className="no-underline hover:text-accent-200">
            <span className="text-2xl font-bold mr-1">PAN-GO</span>
          </Link>
          <Link to="/" className="no-underline hover:text-accent-200">
            <span className="text-2xl">Human Functionome</span>
          </Link>
        </div>

        <div className="hidden md:flex flex-1 justify-end items-center">
          <div className="flex items-center pr-3 text-accent-500">
            <IconButton
              color="inherit"
              href="https://github.com/pantherdb/pango"
              target="_blank"
              size="large"
            >
              <FaGithub />
            </IconButton>
          </div>

          <div className="flex items-center px-3 border-l border-accent-200">
            <Button
              color="inherit"
              className="!text-xl !text-accent-500 hover:text-accent-200"
              onClick={handleExportMenu}
            >
              Download
            </Button>
            <Menu
              anchorEl={exportMenuAnchor}
              open={Boolean(exportMenuAnchor)}
              onClose={handleCloseExportMenu}
            >
              <MenuItem component="a" href="https://functionome.org/download/export_annotations.zip">
                As CSV
              </MenuItem>
              <MenuItem component="a" href="https://functionome.org/download/export_annotations.json.gz">
                As JSON
              </MenuItem>
            </Menu>

            <Button
              color="inherit"
              component={Link}
              className="!text-xl !text-accent-500 hover:text-accent-200"
              to="/about"
            >
              About
            </Button>
          </div>

          <div className="flex items-center">
            <div className="flex items-center px-4 border-l border-accent-200">
              <a href="http://geneontology.org/" target="_blank" rel="noopener noreferrer">
                <img src="/assets/images/logos/go-logo-yellow.png" alt="GO Logo" className="h-11" />
              </a>
            </div>
            <div className="flex items-center px-4 border-l border-accent-200">
              <a href="http://pantherdb.org" target="_blank" rel="noopener noreferrer">
                <img src="/assets/images/logos/panther-logo-yellow.png" alt="Panther Logo" className="h-11" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Toolbar;