import { FiAlertCircle, FiChevronRight, FiArrowUpRight } from "react-icons/fi";
import { useApiVersion, ApiVersions } from '@/app/store/apiService';

const VersionBanner = () => {
  const { currentVersion } = useApiVersion();

  const isPango1 = currentVersion === ApiVersions.V1;
  const isPango2 = currentVersion === ApiVersions.V2;

  if (!isPango1 && !isPango2) {
    return null;
  }

  const message = isPango1
    ? 'New version available!'
    : 'Previous version available';

  const url = isPango1
    ? 'https://functionome.geneontology.org'
    : 'https://functionome.geneontology.org/?apiVersion=pango-1';

  const linkText = isPango1
    ? 'Try PANGO 2.0'
    : 'Switch to PANGO 1.0';

  const bgGradient = isPango1
    ? 'bg-gradient-to-r from-blue-600 to-blue-500'
    : 'bg-gradient-to-r from-blue-500 to-blue-400';

  return (
    <div className={`h-10 ${bgGradient} shadow-md`}>
      <div className="w-full px-4 h-full flex items-center">
        <div className="flex items-center mr-2">
          <span className="text-sm font-medium text-white">{message}</span>
        </div>

        <a
          href={url}
          className="flex items-center px-3 h-8 bg-white/10 hover:bg-white/20 rounded-full text-sm text-white font-medium transition-colors"
        >
          {linkText}
          <FiArrowUpRight className="h-3.5 w-3.5" />
        </a>
      </div>
    </div>
  );
};

export default VersionBanner;