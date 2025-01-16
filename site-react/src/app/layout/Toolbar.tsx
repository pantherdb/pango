import type React from 'react';
import { useState } from 'react';
import { AppBar, Toolbar, IconButton, Button, Menu, MenuItem, Box } from '@mui/material';
import { FaBars, FaGithub } from 'react-icons/fa';
import { Link } from 'react-router-dom';

interface ToolbarProps {
  openLeftDrawer: () => void;
  showLoadingBar?: boolean;
}

const PangoToolbar: React.FC<ToolbarProps> = ({ openLeftDrawer, showLoadingBar }) => {
  const [exportMenuAnchor, setExportMenuAnchor] = useState<null | HTMLElement>(null);

  const handleExportMenu = (event: React.MouseEvent<HTMLElement>) => {
    setExportMenuAnchor(event.currentTarget);
  };

  const handleCloseExportMenu = () => {
    setExportMenuAnchor(null);
  };

  return (
    <AppBar
      position="fixed"
      className="border-b-2 border-primary"
      sx={{
        zIndex: 1300,
        backgroundColor: 'primary.main',
        width: '100%'
      }}
    >
      <Toolbar className="px-2 min-h-[50px]">
        {showLoadingBar && (
          <Box className="absolute top-0 left-0 right-0 w-full">
            <LinearProgress color="secondary" />
          </Box>
        )}

        <IconButton
          color="inherit"
          onClick={openLeftDrawer}
          className="mr-2"
          size="large"
        >
          <FaBars />
        </IconButton>

        <Box className="flex items-center h-full w-[180px]">
          <Link to="/" className="no-underline hover:text-accent-light">
            <span className="text-xl font-bold mr-1">PAN-GO</span>
            <span className="text-xl">Human Functionome</span>
          </Link>
        </Box>

        <Box className="hidden md:flex flex-1 justify-end items-center">
          <Box className="flex items-center border-r border-accent/30 pr-3">
            <IconButton
              color="inherit"
              href="https://github.com/pantherdb/pango"
              target="_blank"
              size="large"
            >
              <FaGithub />
            </IconButton>
          </Box>

          <Box className="flex items-center px-3 border-r border-accent/30">
            <Button
              color="inherit"
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
              to="/about"
            >
              About
            </Button>
          </Box>

          <Box className="flex items-center">
            <Box className="flex items-center p-1 border-l border-accent/30">
              <a href="http://geneontology.org/" target="_blank" rel="noopener noreferrer">
                <img src="/assets/images/logos/go-logo-yellow.png" alt="GO Logo" className="h-10" />
              </a>
            </Box>
            <Box className="flex items-center p-1 border-l border-accent/30">
              <a href="http://pantherdb.org" target="_blank" rel="noopener noreferrer">
                <img src="/assets/images/logos/panther-logo-yellow.png" alt="Panther Logo" className="h-10" />
              </a>
            </Box>
          </Box>
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default PangoToolbar;