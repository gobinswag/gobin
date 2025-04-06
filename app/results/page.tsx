'use client';

import { useState, useEffect } from 'react';
import { FiArrowLeft, FiCalendar, FiInfo } from 'react-icons/fi';
import Link from 'next/link';
import { IBM_Plex_Sans } from 'next/font/google';
import { toast } from 'sonner';

const ibmPlexSans = IBM_Plex_Sans({
  weight: ['400', '500', '600', '700'],
  subsets: ['latin'],
  variable: '--font-ibm-plex-sans',
});

type MaterialType = {
  name: string;
  percentage: number;
  recyclable: 'Highly Recyclable' | 'Recyclable' | 'Limited Recyclability' | 'Special Handling' | 'Not Recyclable';
  co2Impact: 'Low' | 'Medium' | 'High';
  description: string;
  disposalTips: string[];
};

type ScanResult = {
  _id: string;
  material: string;
  isRecyclable: boolean;
  recyclingInfo: string;
  materials: MaterialType[];
  disposalRecommendation: string;
  createdAt: string;
};

export default function ResultsPage() {
  const [results, setResults] = useState<ScanResult[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedResult, setExpandedResult] = useState<string | null>(null);
  const [darkMode, setDarkMode] = useState<boolean>(false);

  useEffect(() => {
    const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    setDarkMode(isDark);
    
    fetchResults();
  }, []);

  const fetchResults = async () => {
    try {
      setLoading(true);
      toast.loading('Loading your recycling history...', {
        id: 'fetch-results',
      });
      
      const response = await fetch('/api/results');
      
      if (!response.ok) {
        throw new Error(`Failed to fetch results: ${response.status}`);
      }
      
      const data = await response.json();
      setResults(data);
      
      if (data.length === 0) {
        toast.info('No scan history found', {
          id: 'fetch-results',
          description: 'Scan an item to build your recycling history.',
        });
      } else {
        toast.success(`Loaded ${data.length} scan results`, {
          id: 'fetch-results',
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
      console.error('Error fetching results:', err);
      toast.error('Failed to load results', {
        id: 'fetch-results',
        description: err instanceof Error ? err.message : 'An unknown error occurred',
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleResultDetails = (id: string) => {
    if (expandedResult === id) {
      setExpandedResult(null);
    } else {
      setExpandedResult(id);
      toast.info('Viewing details', {
        description: 'Showing detailed information for this scan.',
      });
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getRecyclableColor = (isRecyclable: boolean) => {
    return isRecyclable ? 'text-green-500' : 'text-red-500';
  };

  const getRecyclabilityBadgeColor = (recyclable: string) => {
    switch (recyclable) {
      case 'Highly Recyclable':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'Recyclable':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'Limited Recyclability':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'Special Handling':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
      case 'Not Recyclable':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
    }
  };

  const getCO2ImpactBadgeColor = (impact: string) => {
    switch (impact) {
      case 'Low':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'Medium':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'High':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
    }
  };

  return (
    <div className={`min-h-screen ${darkMode ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'} ${ibmPlexSans.variable} font-sans`}>
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center">
            <Link href="/" className={`inline-flex items-center justify-center p-2 rounded-full ${darkMode ? 'bg-gray-800 hover:bg-gray-700' : 'bg-white hover:bg-gray-100'} shadow-sm mr-4`}>
              <FiArrowLeft className="w-5 h-5" />
            </Link>
            <h1 className="text-2xl font-bold">Recycling History</h1>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : error ? (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
            <strong className="font-bold">Error: </strong>
            <span className="block sm:inline">{error}</span>
          </div>
        ) : results.length === 0 ? (
          <div className={`rounded-lg ${darkMode ? 'bg-gray-800' : 'bg-white'} shadow-md p-8 text-center`}>
            <FiInfo className="w-12 h-12 mx-auto mb-4 text-gray-400" />
            <h2 className="text-xl font-semibold mb-2">No Results Found</h2>
            <p className={`${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              You haven&apos;t scanned any items yet. Go back to the home page to scan your first item.
            </p>
            <Link href="/" className="mt-6 inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md">
              Scan an Item
            </Link>
          </div>
        ) : (
          <div className="grid gap-6">
            {results.map((result) => (
              <div 
                key={result._id} 
                className={`rounded-lg ${darkMode ? 'bg-gray-800' : 'bg-white'} shadow-md overflow-hidden`}
              >
                <div 
                  className="p-4 cursor-pointer" 
                  onClick={() => toggleResultDetails(result._id)}
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <h2 className="text-lg font-semibold">{result.material}</h2>
                      <div className="flex items-center mt-1">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRecyclableColor(result.isRecyclable)}`}>
                          {result.isRecyclable ? 'Recyclable' : 'Not Recyclable'}
                        </span>
                        <span className={`ml-2 inline-flex items-center ${darkMode ? 'text-gray-400' : 'text-gray-500'} text-sm`}>
                          <FiCalendar className="mr-1 w-4 h-4" />
                          {formatDate(result.createdAt)}
                        </span>
                      </div>
                    </div>
                    <div className="text-sm font-medium">
                      {expandedResult === result._id ? 'Hide Details' : 'Show Details'}
                    </div>
                  </div>
                </div>

                {expandedResult === result._id && (
                  <div className={`p-4 border-t ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                    <div className="mb-4">
                      <h3 className="font-medium mb-2">Recycling Information</h3>
                      <p className={`${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>{result.recyclingInfo}</p>
                    </div>

                    <div className="mb-4">
                      <h3 className="font-medium mb-2">Materials</h3>
                      {result.materials.map((material, index) => (
                        <div key={index} className={`mb-4 p-3 rounded-md ${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                          <div className="flex justify-between items-center mb-2">
                            <span className="font-medium">{material.name}</span>
                            <span className="text-sm">{material.percentage}%</span>
                          </div>
                          
                          <div className="flex flex-wrap gap-2 mb-2">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRecyclabilityBadgeColor(material.recyclable)}`}>
                              {material.recyclable}
                            </span>
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getCO2ImpactBadgeColor(material.co2Impact)}`}>
                              CO2 Impact: {material.co2Impact}
                            </span>
                          </div>
                          
                          <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'} mt-2`}>{material.description}</p>
                          
                          {material.disposalTips.length > 0 && (
                            <div className="mt-3">
                              <h4 className="text-sm font-medium mb-1">Disposal Tips:</h4>
                              <ul className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'} list-disc pl-5`}>
                                {material.disposalTips.map((tip, tipIndex) => (
                                  <li key={tipIndex}>{tip}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>

                    <div>
                      <h3 className="font-medium mb-2">Recommendation</h3>
                      <p className={`${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>{result.disposalRecommendation}</p>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
