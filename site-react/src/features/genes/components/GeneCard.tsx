import type React from 'react';
import { useState } from 'react';
import type { Gene } from '../models/gene';
import { VersionedLink } from '@/shared/components/VersionedLink';
import { getUniprotLink, getUCSCBrowserLink } from '@/@pango.core/services/linksService';
import Terms from '@/features/terms/components/Terms';
import { motion, AnimatePresence } from 'framer-motion';

interface MobileGeneCardProps {
  gene: Gene;
}

const MobileGeneCard: React.FC<MobileGeneCardProps> = ({ gene }) => {
  const [activeTab, setActiveTab] = useState<'all' | 'mf' | 'bp' | 'cc' | null>(null);

  const tabs = [
    { id: 'all', label: 'All' },
    { id: 'mf', label: `Molecular Function (${gene.groupedTerms?.mfs?.length || 0})` },
    { id: 'bp', label: `Biological Process (${gene.groupedTerms?.bps?.length || 0})` },
    { id: 'cc', label: `Cellular Component (${gene.groupedTerms?.ccs?.length || 0})` }
  ] as const;

  const renderContent = () => {
    if (!activeTab) return null;

    if (activeTab === 'all') {
      return (
        <div className="space-y-6">
          {gene.groupedTerms?.mfs && gene.groupedTerms.mfs.length > 0 && (
            <div>
              <h3 className="mb-2 font-medium text-gray-900">
                Molecular Function ({gene.groupedTerms.mfs.length})
              </h3>
              <Terms terms={gene.groupedTerms.mfs} maxTerms={500} onToggleExpand={() => { }} />
            </div>
          )}
          {gene.groupedTerms?.bps && gene.groupedTerms.bps.length > 0 && (
            <div>
              <h3 className="mb-2 font-medium text-gray-900">
                Biological Process ({gene.groupedTerms.bps.length})
              </h3>
              <Terms terms={gene.groupedTerms.bps} maxTerms={500} onToggleExpand={() => { }} />
            </div>
          )}
          {gene.groupedTerms?.ccs && gene.groupedTerms.ccs.length > 0 && (
            <div>
              <h3 className="mb-2 font-medium text-gray-900">
                Cellular Component ({gene.groupedTerms.ccs.length})
              </h3>
              <Terms terms={gene.groupedTerms.ccs} maxTerms={500} onToggleExpand={() => { }} />
            </div>
          )}
        </div>
      );
    }

    const terms = activeTab === 'mf' ? gene.groupedTerms?.mfs :
      activeTab === 'bp' ? gene.groupedTerms?.bps :
        gene.groupedTerms?.ccs;

    return terms && (
      <Terms terms={terms} maxTerms={500} onToggleExpand={() => { }} />
    );
  };

  return (
    <div className="mb-4 rounded-lg border border-gray-200 bg-white overflow-hidden">
      <div className="p-4">
        <div className="text-lg font-bold text-gray-900">
          <VersionedLink
            to={`/gene/${gene.gene}`}
            className="hover:text-blue-600"
            target="_blank"
            rel="noreferrer"
          >
            {gene.geneSymbol}
          </VersionedLink>
        </div>
        <div className="text-gray-600">{gene.geneName}</div>
        <div className="mt-1 text-sm">
          <a
            href={getUniprotLink(gene.gene)}
            target="_blank"
            rel="noopener noreferrer"
            className="text-gray-500 hover:text-blue-600"
          >
            {gene.gene}
          </a>
        </div>
        {gene.coordinatesChrNum && (
          <div className="mt-1 text-sm text-gray-500">
            UCSC Browser:
            <a
              className="ml-1 hover:text-blue-600"
              href={getUCSCBrowserLink(gene)}
              target="_blank"
              rel="noopener noreferrer"
            >
              chr{gene.coordinatesChrNum}:{gene.coordinatesStart}-{gene.coordinatesEnd}
            </a>
          </div>
        )}
      </div>

      <div className="border-t border-gray-200">
        <div className="flex overflow-x-auto p-2 bg-gray-50">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(prev => prev === tab.id ? null : tab.id as any)}
              className={`whitespace-nowrap px-4 py-2 rounded-full text-sm font-medium mr-2 
                ${activeTab === tab.id
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-600 hover:bg-gray-100'}`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {activeTab && (
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.2 }}
              className="p-4"
            >
              {renderContent()}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default MobileGeneCard;