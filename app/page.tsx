'use client';
import { useState, useRef, useEffect } from 'react';
import Head from 'next/head';
import { FiCamera, FiUpload, FiX, FiCheck, FiInfo, FiArrowRight, FiRepeat, FiHome, FiActivity, FiUsers, FiUser, FiSun, FiMoon } from 'react-icons/fi';
import { IBM_Plex_Sans, Inter } from 'next/font/google';
import Gobin from '@/public/gobinlogo.svg'
import Image from 'next/image';

const ibmPlexSans = IBM_Plex_Sans({
  weight: ['400', '500', '600', '700'],
  subsets: ['latin'],
  variable: '--font-ibm-plex-sans',
});

const inter = Inter({
  weight: ['300', '400', '500', '600'],
  subsets: ['latin'],
  variable: '--font-inter',
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
  material: string;
  isRecyclable: boolean;
  recyclingInfo: string;
  materials: MaterialType[];
  disposalRecommendation: string;
};

type ApiResponse = {
  detected_object: string;
  recyclable: boolean;
  material: string;
  recyclability_score: number;
  recycling_statistics: {
    global_recycling_rate: string;
    processing_notes: string;
    common_issues: string[];
  };
  biotech_insights: {
    biodegradable: boolean;
    bio_recycling_applicable: boolean;
    biotech_notes: string;
  };
  recommendation: string;
};

// Radial Progress Bar Component
const RadialProgressBar = ({ percentage, size = 60, strokeWidth = 5, color = '#2E86C1', darkMode = false }: {
  percentage: number;
  size?: number;
  strokeWidth?: number;
  color?: string;
  darkMode?: boolean;
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="transform -rotate-90"
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="transparent"
          stroke={darkMode ? '#5D6D7E' : '#E0E0E0'}
          strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="transparent"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          className="transition-all duration-1000 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className={`text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-800'}`}>
          {percentage}%
        </span>
      </div>
    </div>
  );
};

export default function RecyclingScanner() {
  const [step, setStep] = useState<'upload' | 'scanning' | 'results'>('upload');
  const [image, setImage] = useState<string | null>(null);
  const [result, setResult] = useState<ScanResult | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [showDetails, setShowDetails] = useState<boolean>(false);
  const [darkMode, setDarkMode] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    setDarkMode(isDark);
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = (event) => {
        setImage(event.target?.result as string);
        startScanning();
      };
      reader.readAsDataURL(file);
    }
  };

  const startScanning = async () => {
    setIsLoading(true);
    setStep('scanning');
    
    try {
      const formData = new FormData();
      if (fileInputRef.current?.files?.[0]) {
        formData.append('image', fileInputRef.current.files[0]);
      }

      const response = await fetch('/api/ai', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`API call failed: ${response.status}`);
      }

      const apiData: ApiResponse = await response.json();
      
      const transformedResult: ScanResult = {
        material: apiData.detected_object,
        isRecyclable: apiData.recyclable,
        recyclingInfo: `${apiData.material} - ${apiData.recycling_statistics.processing_notes}`,
        materials: [
          {
            name: apiData.material,
            percentage: apiData.recyclability_score,
            recyclable: getRecyclabilityLevel(apiData.recyclability_score),
            co2Impact: getCO2Impact(apiData.recyclability_score),
            description: `global_recycling_rate: ${apiData.recycling_statistics.global_recycling_rate}, processing_notes: ${apiData.recycling_statistics.processing_notes}, biodegradable: ${apiData.biotech_insights.biodegradable}, bio_recycling_applicable: ${apiData.biotech_insights.bio_recycling_applicable}, biotech_notes: ${apiData.biotech_insights.biotech_notes}`,
            disposalTips: [
              ...apiData.recycling_statistics.common_issues,
              apiData.recommendation
            ]
          }
        ],
        disposalRecommendation: apiData.recommendation
      };

      setResult(transformedResult);
      setStep('results');
    } catch (error) {
      console.error('Error scanning item:', error);
      alert('Failed to analyze image. Please try again.');
      resetScanner();
    } finally {
      setIsLoading(false);
    }
  };

  const getRecyclabilityLevel = (score: number): MaterialType['recyclable'] => {
    if (score >= 80) return 'Highly Recyclable';
    if (score >= 60) return 'Recyclable';
    if (score >= 40) return 'Limited Recyclability';
    if (score >= 20) return 'Special Handling';
    return 'Not Recyclable';
  };

  const getCO2Impact = (score: number): 'Low' | 'Medium' | 'High' => {
    if (score >= 70) return 'Low';
    if (score >= 40) return 'Medium';
    return 'High';
  };

  const resetScanner = () => {
    setImage(null);
    setStep('upload');
    setResult(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
  };

  return (
    <div className={`min-h-screen ${darkMode ? 'bg-[#1B1F23] text-[#EAECEE]' : 'bg-white text-[#1C1C1C]'} transition-colors duration-200 ${ibmPlexSans.variable} ${inter.variable} font-sans`}>
      <Head>
        <title>Gobin | AI Recycling Assistant</title>
        <meta name="description" content="Scan items to determine recyclability and proper disposal methods" />
      </Head>

      {/* Header */}
      <header className={`${darkMode ? 'bg-[#2C2F33]' : 'bg-white'} shadow-sm z-10`}>
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <div className="flex items-center">
            <div className="flex items-center">
              <div className={`h-8 w-8 rounded-full flex items-center justify-center`}>
                <Image src={Gobin} alt="Gobin Logo" width={32} height={32} className={`${darkMode ? '' : 'invert'}`} />
              </div>
              <span className={`ml-2 text-xl font-bold ${darkMode ? 'text-[#EAECEE]' : 'text-[#1C1C1C]'} ${ibmPlexSans.className}`}>Gobin</span>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <button 
              onClick={toggleDarkMode}
              className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-[#2C2F33]/50"
            >
              {darkMode ? (
                <FiSun className="h-5 w-5 text-[#EAECEE] cursor-pointer" />
              ) : (
                <FiMoon className="h-5 w-5 text-[#1C1C1C] cursor-pointer" />
              )}
            </button>
            {/* <button className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-[#2C2F33]/50">
              <FiUser className="h-5 w-5 text-[#2E86C1]" />
            </button> */}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 pb-16">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center mb-8">
            <h1 className={`text-3xl font-bold ${darkMode ? 'text-[#EAECEE]' : 'text-[#1C1C1C]'} mb-2 ${ibmPlexSans.className}`}>
              {step === 'upload' && 'Scan an Item'}
              {step === 'scanning' && 'Analyzing...'}
              {step === 'results' && 'Scan Results'}
            </h1>
            <p className={`mt-3 text-sm ${inter.className} ${darkMode ? 'text-[#EAECEE]/80' : 'text-[#1C1C1C]/80'}`}>
              {step === 'upload' && 'Upload a photo to determine recyclability and proper disposal'}
              {step === 'scanning' && 'Our AI is analyzing the material composition'}
              {step === 'results' && 'Here are the results of your scan'}
            </p>
          </div>

          {/* Scanner Flow */}
          <div className={`${darkMode ? 'bg-[#2C2F33]' : 'bg-white'} rounded-xl shadow-md overflow-hidden transition-all duration-300`}>
            {step === 'upload' && (
              <div className="p-6">
                <div 
                  className={`border-2 border-dashed ${darkMode ? 'border-[#5D6D7E]' : 'border-gray-300'} rounded-lg p-8 text-center cursor-pointer hover:border-[#2E86C1] transition-colors duration-200`}
                  onClick={triggerFileInput}
                >
                  <div className="flex justify-center">
                    <FiUpload className={`mx-auto h-12 w-12 ${darkMode ? 'text-[#EAECEE]' : 'text-[#1C1C1C]'}`} />
                  </div>
                  <h4 className={`mt-4 text-lg font-medium ${darkMode ? 'text-[#EAECEE]' : 'text-[#1C1C1C]'} ${ibmPlexSans.className}`}>
                    Drag and drop or click to upload
                  </h4>
                  <p className={`mt-1 text-sm ${darkMode ? 'text-[#EAECEE]/60' : 'text-[#1C1C1C]/60'} ${inter.className}`}>
                    PNG, JPG up to 5MB
                  </p>
                  <button 
                    className="mt-6 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-[#2E86C1] hover:bg-[#2E86C1]/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#2E86C1]/50 cursor-pointer"
                    onClick={triggerFileInput}
                  >
                    <FiCamera className="mr-2 h-4 w-4" />
                    Upload Image
                  </button>
                  <input 
                    type="file" 
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept="image/*"
                    className="hidden"
                  />
                </div>
              </div>
            )}

            {step === 'scanning' && (
              <div className="p-8 text-center">
                <div className="relative h-64 flex items-center justify-center">
                  {image && (
                    <div className="absolute inset-0 overflow-hidden rounded-lg">
                      <Image 
                        src={image} 
                        alt="Scanned item" 
                        className="w-full h-full object-contain blur-sm opacity-50"
                        width={500}
                        height={300}
                        unoptimized={true}
                      />
                    </div>
                  )}
                  <div className="relative z-10">
                    <div className="animate-pulse flex flex-col items-center">
                      <div className={`w-20 h-20 ${darkMode ? 'bg-[#2E86C1]/20' : 'bg-[#2E86C1]/10'} rounded-full flex items-center justify-center mb-4`}>
                        <FiActivity className="h-8 w-8 text-[#2E86C1] animate-spin" />
                      </div>
                      <div className={`w-full ${darkMode ? 'bg-[#5D6D7E]/30' : 'bg-gray-200'} rounded-full h-2.5 mb-2`}>
                        <div 
                          className="bg-[#2E86C1] h-2.5 rounded-full transition-all duration-500" 
                          style={{ width: `${isLoading ? '85%' : '100%'}` }}
                        ></div>
                      </div>
                      <p className={`text-sm ${darkMode ? 'text-[#EAECEE]/60' : 'text-[#1C1C1C]/60'} ${inter.className} mt-2`}>
                        Analyzing material composition...
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {step === 'results' && result && (
              <div className={`divide-y ${darkMode ? 'divide-[#5D6D7E]/30' : 'divide-gray-200'}`}>
                <div className="p-6">
                  <div className="flex items-start">
                    {image && (
                      <div className="flex-shrink-0 h-16 w-16 rounded-lg overflow-hidden mr-4">
                        <Image 
                          src={image} 
                          alt="Scanned item" 
                          className="h-full w-full object-cover"
                          width={64}
                          height={64}
                          unoptimized={true}
                        />
                      </div>
                    )}
                    <div>
                      <h3 className={`text-lg font-medium ${darkMode ? 'text-[#EAECEE]' : 'text-[#1C1C1C]'} ${ibmPlexSans.className}`}>{result.material}</h3>
                      <div className="flex items-center mt-1 space-x-2">
                        <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${result.isRecyclable ? 'bg-[#27AE60]/20 text-[#27AE60]' : 'bg-[#E74C3C]/20 text-[#E74C3C]'}`}>
                          {result.isRecyclable ? 'Recyclable' : 'Not Recyclable'}
                          {result.isRecyclable ? (
                            <FiCheck className="ml-1 h-3 w-3" />
                          ) : (
                            <FiX className="ml-1 h-3 w-3" />
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                  <p className={`mt-3 text-sm ${inter.className} ${darkMode ? 'text-[#EAECEE]/80' : 'text-[#1C1C1C]/80'}`}>
                    {result.recyclingInfo}
                  </p>
                  {result.materials[0] && (
                    <div className="inline-flex items-center gap-4 px-4.5 py-2.5 mt-3 rounded-full text-xs font-medium bg-[#2E86C1]/20 text-[#2E86C1]">
                      <RadialProgressBar 
                        percentage={result.materials[0].percentage} 
                        size={100} 
                        strokeWidth={9} 
                        color={result.materials[0].recyclable === 'Highly Recyclable' ? '#27AE60' :
                                result.materials[0].recyclable === 'Recyclable' ? '#2E86C1' :
                                result.materials[0].recyclable === 'Limited Recyclability' ? '#F1C40F' :
                                result.materials[0].recyclable === 'Special Handling' ? '#8E44AD' : '#E74C3C'}
                        darkMode={darkMode}
                      />
                      <div className="flex flex-col">
                        <span className="ml-1 font-bold text-white">Recycle Score</span>
                        <span className="ml-1 brightness-150">{result.materials[0].recyclable}</span>
                      </div>
                    </div>
                  )}
                </div>

                <div className="p-6">
                  <h4 className={`text-sm font-medium ${darkMode ? 'text-[#EAECEE]/60' : 'text-[#1C1C1C]/60'} uppercase tracking-wider mb-3 ${ibmPlexSans.className}`}>
                    Recycling Statistics
                  </h4>
                  <div className="space-y-4">
                    <div className="flex justify-between mb-2">
                      <span className={`text-sm font-medium ${inter.className} ${darkMode ? 'text-[#EAECEE]' : 'text-[#1C1C1C]'}`}>Global Recycling Rate</span>
                      <span className={`text-sm font-medium ${inter.className} ${darkMode ? 'text-[#EAECEE]' : 'text-[#1C1C1C]'}`}>{result.materials[0]?.description.includes('global_recycling_rate') ? result.materials[0]?.description.split('global_recycling_rate: ')[1]?.split(',')[0] || '35%' : '35%'}</span>
                    </div>
                    <div 
                      className={`h-2 rounded-full ${darkMode ? 'bg-[#5D6D7E]/30' : 'bg-gray-200'}`}
                    >
                      <div
                        className={`h-2 rounded-full ${
                          result.materials[0]?.recyclable === 'Highly Recyclable' ? 'bg-[#27AE60]' :
                          result.materials[0]?.recyclable === 'Recyclable' ? 'bg-[#2E86C1]' :
                          result.materials[0]?.recyclable === 'Limited Recyclability' ? 'bg-[#F1C40F]' :
                          result.materials[0]?.recyclable === 'Special Handling' ? 'bg-[#8E44AD]' : 'bg-[#E74C3C]'
                        }`}
                        style={{ 
                          width: `${parseInt(result.materials[0]?.description.includes('global_recycling_rate') ? 
                            result.materials[0]?.description.split('global_recycling_rate: ')[1]?.split(',')[0].replace('%', '') || '35' : 
                            '35')}%` 
                        }}
                      ></div>
                    </div>
                    <div>
                      <h5 className={`text-sm font-medium ${darkMode ? 'text-[#EAECEE]/80' : 'text-[#1C1C1C]/80'} mb-2 ${ibmPlexSans.className}`}>Common Issues</h5>
                      <div className="grid grid-cols-1 gap-2">
                        {result.materials[0]?.disposalTips.slice(0, -1).map((issue, index) => (
                          <div key={index} className="flex items-start">
                            <div className="flex-shrink-0 mt-1">
                              <div className="h-2 w-2 rounded-full bg-[#F1C40F]"></div>
                            </div>
                            <p className={`ml-2 text-sm ${inter.className} ${darkMode ? 'text-[#EAECEE]/90' : 'text-[#1C1C1C]/90'}`}>{issue}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-6">
                  <h4 className={`text-sm font-medium ${darkMode ? 'text-[#EAECEE]/60' : 'text-[#1C1C1C]/60'} uppercase tracking-wider mb-3 ${ibmPlexSans.className}`}>
                    Material Breakdown
                  </h4>
                  <div className="space-y-4">
                    {result.materials.map((material, index) => (
                      <div key={index}>
                        <div className="flex justify-between mb-1">
                          <span className={`text-sm font-medium ${inter.className} ${darkMode ? 'text-[#EAECEE]' : 'text-[#1C1C1C]'}`}>{material.name}</span>
                          <span className={`text-sm font-medium ${inter.className} ${darkMode ? 'text-[#EAECEE]' : 'text-[#1C1C1C]'}`}>{material.percentage}%</span>
                        </div>
                        <div className={`w-full ${darkMode ? 'bg-[#5D6D7E]/30' : 'bg-gray-200'} rounded-full h-2`}>
                          <div 
                            className={`h-2 rounded-full ${
                              material.recyclable === 'Highly Recyclable' ? 'bg-[#27AE60]' :
                              material.recyclable === 'Recyclable' ? 'bg-[#2E86C1]' :
                              material.recyclable === 'Limited Recyclability' ? 'bg-[#F1C40F]' :
                              material.recyclable === 'Special Handling' ? 'bg-[#8E44AD]' : 'bg-[#E74C3C]'
                            }`}
                            style={{ width: `${material.percentage}%` }}
                          ></div>
                        </div>
                        <div className="flex justify-between mt-1">
                          <span className={`text-xs ${inter.className} ${darkMode ? 'text-[#EAECEE]/60' : 'text-[#1C1C1C]/60'}`}>{material.recyclable}</span>
                          <span className={`text-xs ${inter.className} ${darkMode ? 'text-[#EAECEE]/60' : 'text-[#1C1C1C]/60'}`}>
                            CO₂: {material.co2Impact}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="p-6">
                  <h4 className={`text-sm font-medium ${darkMode ? 'text-[#EAECEE]/60' : 'text-[#1C1C1C]/60'} uppercase tracking-wider mb-3 ${ibmPlexSans.className}`}>
                    Biotech Insights
                  </h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className={`text-sm ${inter.className} ${darkMode ? 'text-[#EAECEE]/90' : 'text-[#1C1C1C]/90'}`}>Biodegradable</span>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${result.materials[0]?.description.includes('biodegradable: true') ? 'bg-[#27AE60]/20 text-[#27AE60]' : 'bg-[#E74C3C]/20 text-[#E74C3C]'}`}>
                        {result.materials[0]?.description.includes('biodegradable: true') ? 'Yes' : 'No'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className={`text-sm ${inter.className} ${darkMode ? 'text-[#EAECEE]/90' : 'text-[#1C1C1C]/90'}`}>Bio-recycling Applicable</span>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${result.materials[0]?.description.includes('bio_recycling_applicable: true') ? 'bg-[#27AE60]/20 text-[#27AE60]' : 'bg-[#E74C3C]/20 text-[#E74C3C]'}`}>
                        {result.materials[0]?.description.includes('bio_recycling_applicable: true') ? 'Yes' : 'No'}
                      </span>
                    </div>
                    <div className="mt-3">
                      <h5 className={`text-sm font-medium ${darkMode ? 'text-[#EAECEE]/80' : 'text-[#1C1C1C]/80'} mb-2 ${ibmPlexSans.className}`}>Biotech Notes</h5>
                      <p className={`text-sm ${inter.className} ${darkMode ? 'text-[#EAECEE]/80' : 'text-[#1C1C1C]/80'}`}>
                        {result.materials[0]?.description.includes('biotech_notes') ? 
                          result.materials[0]?.description.split('biotech_notes: ')[1] : 
                          'Currently, there are no viable large-scale biotechnological methods for degrading or recycling this material.'}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="p-6">
                  <h4 className={`text-sm font-medium ${darkMode ? 'text-[#EAECEE]/60' : 'text-[#1C1C1C]/60'} uppercase tracking-wider mb-3 ${ibmPlexSans.className}`}>
                    Disposal Recommendation
                  </h4>
                  <div className={`flex items-start ${darkMode ? 'bg-[#2E86C1]/10' : 'bg-[#2E86C1]/5'} rounded-lg p-4`}>
                    <FiInfo className={`flex-shrink-0 h-5 w-5 text-[#2E86C1] mt-0.5`} />
                    <div className="ml-3">
                      <p className={`text-sm ${inter.className} ${darkMode ? 'text-[#2E86C1]' : 'text-[#2E86C1]'}`}>
                        {result.disposalRecommendation}
                      </p>
                    </div>
                  </div>

                  <button 
                    className={`mt-4 text-sm font-medium ${inter.className} ${darkMode ? 'text-[#2E86C1] hover:text-[#2E86C1]/80' : 'text-[#2E86C1] hover:text-[#2E86C1]/90'} flex items-center`}
                    onClick={() => setShowDetails(!showDetails)}
                  >
                    {showDetails ? 'Hide' : 'Show'} detailed disposal tips
                    <FiArrowRight className={`ml-1 h-4 w-4 transition-transform ${showDetails ? 'rotate-90' : ''}`} />
                  </button>

                  {showDetails && (
                    <div className="mt-4 space-y-3">
                      {result.materials.flatMap((material, index) => 
                        material.disposalTips.map((tip, tipIndex) => (
                          <div key={`${index}-${tipIndex}`} className="flex items-start">
                            <div className="flex-shrink-0 mt-1">
                              <div className={`h-2 w-2 rounded-full ${
                                material.recyclable === 'Highly Recyclable' ? 'bg-[#27AE60]' :
                                material.recyclable === 'Recyclable' ? 'bg-[#2E86C1]' :
                                material.recyclable === 'Limited Recyclability' ? 'bg-[#F1C40F]' :
                                material.recyclable === 'Special Handling' ? 'bg-[#8E44AD]' : 'bg-[#E74C3C]'
                              }`}></div>
                            </div>
                            <p className={`ml-2 text-sm ${inter.className} ${darkMode ? 'text-[#EAECEE]/90' : 'text-[#1C1C1C]/90'}`}>{tip}</p>
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {step === 'results' && (
            <div className="mt-6 flex justify-center space-x-3">
              <button 
                className={`inline-flex items-center px-4 py-2 border ${darkMode ? 'border-[#5D6D7E] text-[#EAECEE] hover:bg-[#2C2F33]/50' : 'border-gray-300 text-[#1C1C1C] hover:bg-gray-50'} rounded-md shadow-sm text-sm font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#2E86C1]/50 cursor-pointer`}
                onClick={resetScanner}
              >
                <FiCamera className="mr-2 h-4 w-4" />
                Scan Another Item
              </button>
              <button disabled={true} className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-[#4EA6E1] hover:bg-[#2E86C1]/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#2E86C1]/50">
                Post results
              </button>
            </div>
          )}
        </div>
      </main>

      {/* Mobile Bottom Navigation */}
      <div className={`md:hidden fixed bottom-0 left-0 right-0 ${darkMode ? 'bg-[#2C2F33]' : 'bg-white'} shadow-lg z-20`}>
        <div className="flex justify-around">
          <button className={`w-full ${darkMode ? 'text-[#2E86C1]' : 'text-[#2E86C1]'} justify-center inline-block text-center pt-3 pb-2`}>
            <FiHome className="h-6 w-6 mx-auto" />
            <span className={`block text-xs mt-1 ${inter.className}`}>Home</span>
          </button>
          <button className={`w-full ${darkMode ? 'text-[#EAECEE]/60' : 'text-[#1C1C1C]/60'} justify-center inline-block text-center pt-3 pb-2`}>
            <FiActivity className="h-6 w-6 mx-auto" />
            <span className={`block text-xs mt-1 ${inter.className}`}>Analytics</span>
          </button>
          <button className={`w-full ${darkMode ? 'text-[#EAECEE]/60' : 'text-[#1C1C1C]/60'} justify-center inline-block text-center pt-3 pb-2`}>
            <FiCamera className="h-6 w-6 mx-auto" />
            <span className={`block text-xs mt-1 ${inter.className}`}>Scan</span>
          </button>
          <button className={`w-full ${darkMode ? 'text-[#EAECEE]/60' : 'text-[#1C1C1C]/60'} justify-center inline-block text-center pt-3 pb-2`}>
            <FiUsers className="h-6 w-6 mx-auto" />
            <span className={`block text-xs mt-1 ${inter.className}`}>Community</span>
          </button>
        </div>
      </div>
    </div>
  );
}