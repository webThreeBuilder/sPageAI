'use client';

import { useCallback, useState, useEffect } from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { tomorrow } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { TypewriterEffect } from "@/components/ui/typewriter-effect";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Lightbulb,  MessageSquare, Code2, FileCode, Monitor, Tablet, Smartphone, Settings, Copy, Download, Eye, Code, GripVertical, ArrowUp, Github } from 'lucide-react';
import { cn } from "@/lib/utils";
import { Toaster, toast } from 'sonner';
import { Input } from "@/components/ui/input";
import { useLocalStorage } from 'react-use';
import { historyManager } from '@/lib/history';
import { HistoryPanel } from '@/components/history-panel';

import { GenerationVersion } from '@/types/generation';

export default function Home() {

  const [apiKey, setApiKey] = useLocalStorage<string>('deepseek-api-key', '');
    const [showSettings, setShowSettings] = useState(false);
  
    const saveApiKey = (key: string) => {
      setApiKey(key);
      setShowSettings(false);
      toast.success('API Key saved');
    };
    const [prompt, setPrompt] = useState('');
    const [generatedCode, setGeneratedCode] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [finished, setFinished] = useState(false);
    const [activeTab, setActiveTab] = useState<'preview' | 'code'>('preview');
    const [deviceMode, setDeviceMode] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
    const [history, setHistory] = useState<GenerationVersion[]>([]);
    const [abortController, setAbortController] = useState<AbortController | null>(null);

    const examples = [
      'Create a landing page for a modern coffee shop with a hero section and a call-to-action button.',
      'Design a simple portfolio page with a gallery of images and a call-to-action button',
      'Make a product card for an e-commerce website with a product grid and a shopping cart',
      'Build a responsive pricing table with the ability to switch between monthly and yearly plans',
      'Create a project to help users quickly launch an MVP with sections for features, pain points, user reviews, our project, and contact us, using a tech-inspired background, black and dark gray text, blue as the primary color, and entry animations for each section.',
    ];
  

  
    // 添加拖动分隔条相关的状态
    const [splitPosition, setSplitPosition] = useState(35);
    const [isDragging, setIsDragging] = useState(false);
  
    const handleMouseDown = useCallback((e: React.MouseEvent) => {
      setIsDragging(true);
      e.preventDefault();
    }, []);
  
    const handleMouseMove = useCallback((e: MouseEvent) => {
      if (!isDragging) return;
      const container = document.getElementById('split-container');
      if (!container) return;
  
      const { left, width } = container.getBoundingClientRect();
      const newPosition = ((e.clientX - left) / width) * 100;
      setSplitPosition(Math.min(Math.max(newPosition, 30), 70));
    }, [isDragging]);
  
    const handleMouseUp = useCallback(() => {
      setIsDragging(false);
    }, []);
  
    const copyToClipboard = async () => {
      try {
        await navigator.clipboard.writeText(generatedCode);
        toast.success('Copied');
      } catch (err) {
        console.info(err)
        toast.error('Copy failed');
      }
    };
    
    const downloadCode = () => {
      const blob = new Blob([generatedCode], { type: 'text/html' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'generated-page.html';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success('File Downloaded');
    };

    const handleViewCode = (version: GenerationVersion) => {
      setGeneratedCode(version.code);
      setFinished(true);
      setActiveTab('code');
    };
    
    const handleViewPreview = (version: GenerationVersion) => {
      setGeneratedCode(version.code);
      setFinished(true);
      setActiveTab('preview');
    };
    
    const handleLoadPrompt = (version: GenerationVersion) => {
      setPrompt(version.prompt);
    };
    
    useEffect(() => {
      const historyData = historyManager.getHistory();
      // 确保返回的历史记录符合 GenerationVersion 类型
      const typedHistory = historyData.map(item => ({
        id: item.id,
        prompt: item.prompt,
        code: item.code || '',  // 确保 code 属性存在
        timestamp: item.timestamp
      }));
      
      setHistory(typedHistory);

      if (isDragging) {
        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);
      }
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
      
    }, [isDragging, setHistory, handleMouseMove, handleMouseUp]);
  
    const generateLandingPage = async () => {
      if (!prompt) return;
      const controller = new AbortController();
      setAbortController(controller);
      setIsLoading(true);
      setGeneratedCode('');
      setFinished(false);
      setActiveTab('code');

      try {
        const response = await fetch('/api/generate', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ prompt }),
          signal: controller.signal
        });
  
        if (!response.ok) throw new Error('生成失败');
  
        const reader = response.body?.getReader();
        if (!reader) throw new Error('Stream not supported');
  
        let buffer = '';
        let completeCode = '';
  
        while (true) {
          try {
            const { done, value } = await reader.read();
            
            if (done) {
              setFinished(true);
              // 修改 timestamp 为数字类型
              const newVersion = {
                id: Date.now().toString(),
                prompt,
                code: completeCode,
                timestamp: Date.now()  // 使用时间戳而不是 ISO 字符串
              };
              historyManager.saveVersion(newVersion);
              break;
            }
  
            const text = new TextDecoder().decode(value);
            buffer += text;
            
            const lines = buffer.split('\n');
            buffer = lines.pop() || '';
            
            for (const line of lines) {
              if (!line.trim()) continue;
              try {
                const data = JSON.parse(line);
                if (data.chunk) {
                  completeCode += data.chunk;
                  setGeneratedCode(prev => prev + data.chunk);
                }
              } catch (e) {
                console.info(e)
                console.warn('Invalid JSON:', line);
                continue;
              }
            }
          } catch (streamError) {
            console.error('Stream error:', streamError);
            break;
          }
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        toast.error('Generate failed: ' + errorMessage);
      } finally {
        setIsLoading(false);
      }
    };
      return (
      <>
            <div className="min-h-screen relative overflow-hidden">
          <div className="absolute inset-0 bg-grid-small-black/[0.07] -z-10" />
          
          <div className="absolute -bottom-20 left-[10%] w-[1000px] h-[150px] bg-sky-500 rounded-full mix-blend-multiply filter blur-3xl opacity-[0.08] animate-glow-pulse" />
          <div className="absolute -bottom-10 left-[30%] w-[800px] h-[125x] bg-blue-400 rounded-full mix-blend-multiply filter blur-3xl opacity-[0.08] animate-blob" />
          <div className="absolute bottom-0 left-[50%] w-[900px] h-[140px] bg-cyan-500 rounded-full mix-blend-multiply filter blur-3xl opacity-[0.08] animate-blob animation-delay-2000" />
          
        
        <main className="min-h-screen p-8 max-w-7xl mx-auto relative">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-primary rounded flex items-center justify-center">

<svg width="16px" height="19px" viewBox="0 0 16 19" version="1.1" xmlns="http://www.w3.org/2000/svg">
    <g id="Page-6" stroke="none" strokeWidth="1" fill="none" fillRule="evenodd">
        <g id="13405280_5205771" transform="translate(-346.000000, -13.000000)" fill="#FFFFFF" fillRule="nonzero">
            <g id="OBJECTS" transform="translate(45.935000, 13.613000)">
                <g id="Group" transform="translate(300.410000, 0.000000)">
                    <polygon id="Path" points="7.14676529 11.9807685 0.0265040274 7.97958281 0.0265040274 4.3422893 7.62749351 0 15 4.21170773 14.543034 4.99483542 7.62749351 1.04429082 0.940436006 4.86425385 0.940436006 7.4532776 7.5980649 11.1945661"></polygon>
                    <polygon id="Path" points="7.37250649 18 0 13.7882923 0.45696599 13.0051646 7.37250649 16.9557092 14.059564 13.1357462 14.059564 10.5445521 7.14402349 6.59400748 7.60098948 5.81087979 14.973496 10.0224067 14.973496 13.6577107"></polygon>
                    <g transform="translate(1.791529, 8.425960)" id="Rectangle">
                        <polygon transform="translate(7.807586, 4.680801) rotate(-29.744171) translate(-7.807586, -4.680801) " points="2.16362685 4.20182225 13.4473974 4.25315793 13.4515443 5.15978068 2.16777378 5.10844501"></polygon>
                        <polygon transform="translate(5.289423, 3.314193) rotate(-29.846502) translate(-5.289423, -3.314193) " points="-0.533505764 2.83429083 11.1081964 2.88736694 11.1123524 3.79409592 -0.529349712 3.74101981"></polygon>
                    </g>
                    <g transform="translate(0.124191, 1.560047)" id="Rectangle">
                        <polygon transform="translate(5.137919, 3.215955) rotate(-29.744171) translate(-5.137919, -3.215955) " points="-0.505948653 2.7369759 10.7776396 2.78831075 10.7817865 3.6949335 -0.501801723 3.64359865"></polygon>
                        <polygon transform="translate(7.571725, 4.621178) rotate(-29.484780) translate(-7.571725, -4.621178) " points="1.88347081 4.142123 13.2558537 4.19358151 13.2599786 5.10023239 1.88759574 5.04877387"></polygon>
                    </g>
                </g>
            </g>
        </g>
    </g>
</svg>

         </div>
              <h1 className="text-xl font-semibold">sPage AI</h1>
            </div>
            <Button variant="ghost" size="sm" onClick={() => setShowSettings(true)}>
              <Settings className="h-4 w-4" />
              
            </Button>
          </div>
    
          {showSettings && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
              <Card className="w-[400px]">
                <CardHeader>
                  <CardTitle>Settings</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">DeepSeek API Key</label>
                      <Input
                        type="password"
                        placeholder="sk-..."
                        defaultValue={apiKey}
                        onChange={(e) => saveApiKey(e.target.value)}
                      />
                    </div>
                  </div>
                </CardContent>
                <div className="p-6 flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setShowSettings(false)}>
                    Cancel
                  </Button>
                  <Button onClick={() => setShowSettings(false)}>
                    Save
                  </Button>
                </div>
              </Card>
            </div>
          )}
    
    <div className="text-center space-y-2 mb-12">
        {/* <h2 className="text-3xl font-bold tracking-tight">Generate Single-Page HTML Code Faster Than Ever</h2> */}
        <TypewriterEffect 
          words="Create Single-Page HTML Code Instantly"
          className="mx-auto text-3xl font-bold tracking-tigh"
        />

    </div>
    
          <div id="split-container" className="border rounded-lg">
            <div className="flex relative">
              <div style={{ width: `${splitPosition}%` }} className="p-6">
                <div className="space-y-6">
                  
                  <div className="shadow-none">
                    <div className="">
                    
                    <div className="relative bg-muted/50 rounded-lg mb-6">
                        <Textarea
                          className="min-h-[200px] resize-none p-4 pb-16 text-base leading-relaxed focus:bg-background border-none placeholder:text-foreground placeholder:font-medium"
                          placeholder="Enter the details of the webpage you want to create, and let AI generate clean, structured HTML code for you"
                          value={prompt}
                          onChange={(e) => setPrompt(e.target.value)}
                        />


                                  <TooltipProvider>
                                  <Tooltip>
                                  <TooltipTrigger asChild>
                        
                        <Button
                            className="absolute right-4 bottom-4 w-8 h-8 rounded-full"
                            disabled={false}
                            onClick={() => {
                              if (isLoading) {
                                abortController?.abort();
                                setIsLoading(false);
                              } else {
                                generateLandingPage();
                              }
                            }}
                          >
                            {isLoading ? (
                               <div className="relative w-3 h-3">
                               <div className="absolute w-1.5 h-full bg-current left-0"></div>
                               <div className="absolute w-1.5 h-full bg-current right-0"></div>
                              </div>
                            ) : (
                              <ArrowUp className="h-5 w-5" />
                            )}
                          </Button>
                              </TooltipTrigger>

                              <TooltipContent>
                                <p>
                                  {isLoading ? (
                               <>
                               Stop
                              </>
                            ) : (
                              <>
                               Generate
                              </>
                            )}
                                  </p>
                                </TooltipContent>
                              </Tooltip>
                              </TooltipProvider>


                      </div>

                      
    
                      <HistoryPanel
                        history={history}
                        examples={examples}
                        onViewCode={handleViewCode}
                        onViewPreview={handleViewPreview}
                        onLoadPrompt={handleLoadPrompt}
                        onSelectExample={setPrompt}
                      />
                      
                    </div>
                  </div>
    
                  <Card className="border shadow-none bg-muted/30 backdrop-blur-sm">
                      <CardHeader>
                        <CardTitle className="text-xl font-semibold flex items-center gap-2">
                          <Lightbulb className="h-5 w-5 text-primary" />
                          How It Works
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-6">
                        {[
                          {
                            step: 1,
                            title: "Enter Your Prompt",
                            desc: "Describe the HTML page you want in plain language.",
                            icon: <MessageSquare className="h-4 w-4" />
                          },
                          {
                            step: 2,
                            title: "Generate Code",
                            desc: "AI processes your request and generates clean, semantic code.",
                            icon: <Code2 className="h-4 w-4" />
                          },
                          {
                            step: 3,
                            title: "Use or Preview",
                            desc: "Copy the code or preview it instantly, then integrate it into your project effortlessly.",
                            icon: <FileCode className="h-4 w-4" />
                          }
                        ].map(({ step, title, desc, icon }) => (
                          <div key={step} className="flex gap-4 p-3 rounded-lg hover:bg-muted/50 transition-colors">
                            <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center shrink-0 text-primary">
                              {icon}
                            </div>
                            <div>
                              <h4 className="font-medium flex items-center gap-2">
                                <span className="text-primary">{step}.</span> {title}
                              </h4>
                              <p className="text-sm text-muted-foreground mt-1">{desc}</p>
                            </div>
                          </div>
                        ))}
                      </CardContent>
                    </Card>
                </div>
              </div>
    
              <div
                className="absolute top-0 bottom-0 w-1 bg-border cursor-col-resize hover:bg-primary/50 transition-colors group"
                style={{ left: `${splitPosition}%` }}
                onMouseDown={handleMouseDown}
              >
                <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-6 h-6 bg-white border rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <GripVertical className="h-4 w-4 text-muted-foreground" />
                </div>
              </div>
    
              <div style={{ width: `${100 - splitPosition}%` }} className="p-6">
                <Card className="border shadow-none h-full">

                  
                  <Tabs defaultValue="preview" className="w-full" 
                  value={activeTab} 
                  onValueChange={(value) => {setActiveTab(value)}}> 
                  
                  <CardHeader className="pb-0 border-b">
                        <div className="flex justify-between items-center">
                          <TabsList className="w-[200px]">
                          <TabsTrigger value="preview" disabled={!finished}>
                              {!finished && isLoading ? (
                                <div className="flex items-center">
                                  <div className="h-4 w-4 mr-2 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                                  Preview
                                </div>
                              ) : (
                                <>
                                  <Eye className="h-4 w-4 mr-2" />
                                  Preview
                                </>
                              )}
                            </TabsTrigger>
                            <TabsTrigger value="code">
                              <Code className="h-4 w-4 mr-2" />
                              Code
                            </TabsTrigger>
                          </TabsList>

                          {finished && (activeTab === 'preview' ? (
                            <div className="border rounded-md">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setDeviceMode('desktop')}
                                className={cn(
                                  "rounded-none border-r",
                                  deviceMode === 'desktop' ? 'bg-muted' : ''
                                )}
                              >
                                <Monitor className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setDeviceMode('tablet')}
                                className={cn(
                                  "rounded-none border-r",
                                  deviceMode === 'tablet' ? 'bg-muted' : ''
                                )}
                              >
                                <Tablet className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setDeviceMode('mobile')}
                                className={cn(
                                  "rounded-none",
                                  deviceMode === 'mobile' ? 'bg-muted' : ''
                                )}
                              >
                                <Smartphone className="h-4 w-4" />
                              </Button>
                            </div>
                          ) : (
                            <div className="flex gap-2">
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                    <Button 
                                      variant="ghost" 
                                      className=''
                                      size="sm" 
                                      onClick={copyToClipboard}
                                    >
                                      <Copy className="h-4 w-4" />
                                    </Button>
                              </TooltipTrigger>
                                  <TooltipContent>
                                    <p>Copy Code</p>
                                  </TooltipContent>
                                </Tooltip>

                              <Tooltip>
                              <TooltipTrigger asChild>

                              <Button 
                                variant="ghost" 
                                size="sm" 
                                onClick={downloadCode}
                              >
                                <Download className="h-4 w-4" />
                              </Button>
                              </TooltipTrigger>
                                <TooltipContent>
                                  <p>Download Code</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                            </div>
                          ))}


                        </div>
                      </CardHeader>

                 
                    <CardContent className="p-0">
                      <div className="h-[calc(100vh-0rem)] overflow-auto rounded-b-lg">
                        {!generatedCode && !finished  ? (
                          <div className="h-full flex items-center justify-center text-muted-foreground">
                            {activeTab === 'preview' ? (
                                <>
                                Your preview will appear here once code is generated
                              </>
                              ) : (
                                <>
                                  Your code will appear here once you start to generate
                                </>
                              )}
                          </div>
                        ) : (
                          <>
                            <TabsContent value="preview" className="mt-0">
                              {!finished ? (
                                <div className="h-full flex flex-col items-center justify-center text-muted-foreground">
                                  <div className="p-4 space-y-2">
                                    <Skeleton className="h-4 w-full" />
                                    <Skeleton className="h-4 w-3/4" />
                                    <Skeleton className="h-4 w-1/2" />
                                  </div>
                                </div>
                              ) : (
                                <>
                                  
                                  <div className="flex justify-center p-4 bg-gray-100 h-[calc(100vh-0rem)] overflow-auto">
                                    <div className={cn(
                                      "bg-white transition-all duration-300 h-full",
                                      {
                                        'w-full': deviceMode === 'desktop',
                                        'w-[768px]': deviceMode === 'tablet',
                                        'w-[375px]': deviceMode === 'mobile',
                                      }
                                    )}>
                                      <iframe
                                        srcDoc={generatedCode}
                                        className="w-full h-full"
                                        title="预览"
                                      />
                                    </div>
                                  </div>
                                </>
                              )}
                            </TabsContent>
                            
                            
                            <TabsContent value="code" className="mt-0">
                              <div className="relative bg-dark">
                                
                                <div className="max-h-[calc(100vh-0rem)] overflow-auto ">
                                  <SyntaxHighlighter language="html" style={tomorrow} customStyle={{ margin: 0, minHeight: '100vh' }}>
                                    {generatedCode}
                                  </SyntaxHighlighter>
                                </div>
                              </div>
                            </TabsContent>
                          </>
                        )}
                      </div>
                    </CardContent>
                  </Tabs>
                </Card>
              </div>
            </div>
          </div>
      </main>

       
      <footer className=" p-8 max-w-7xl mx-auto  bg-background/95">
        <div className="container flex flex-col items-center justify-between gap-4 py-6 md:h-16 md:flex-row md:py-0">
          <div className="flex flex-col items-center gap-4 md:flex-row md:gap-2 text-sm text-muted-foreground">
            <p>© 2025 sPage AI. All rights reserved.</p>
          </div>
          <div className="flex items-center gap-4">
            <a
              href="https://github.com/web3builder/mvp_ai"
              target="_blank"
              rel="noreferrer"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-2"
            >
              <Github className="h-4 w-4" />
              GitHub
            </a>
          </div>
        </div>
      </footer>
      </div>

      <Toaster />
      </>
    );
}
