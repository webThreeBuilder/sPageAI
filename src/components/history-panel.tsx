import { Button } from "@/components/ui/button";
import { Eye, Code, MessageSquare, Sparkles, History } from 'lucide-react';
import { GenerationVersion } from '@/types/generation';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Layout, Coffee, Image as ImageIcon, ShoppingBag, Table } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { RotateCcw } from 'lucide-react';  // 添加这个导入
import { Copy } from 'lucide-react';  // 添加导入
import { toast } from "sonner";  // 添加导入
import { useState, useEffect } from 'react';
import { historyManager } from '@/lib/history';

interface HistoryPanelProps {
  history: GenerationVersion[];
  examples: string[];
  onViewCode: (version: GenerationVersion) => void;
  onViewPreview: (version: GenerationVersion) => void;
  onLoadPrompt: (version: GenerationVersion) => void;
  onSelectExample: (example: string) => void;
}

export function HistoryPanel({ 
  history, 
  examples, 
  onViewCode, 
  onViewPreview, 
  onLoadPrompt, 
  onSelectExample 
}: HistoryPanelProps) {
  const actionButtons = [
    { icon: Eye, onClick: onViewPreview, tooltip: "Preview" },
    { icon: Code, onClick: onViewCode, tooltip: "Code" },
    { 
      icon: Copy, 
      onClick: (version: GenerationVersion) => {
        navigator.clipboard.writeText(version.prompt);
        toast.success("Prompt copied to clipboard");
      }, 
      tooltip: "Copy prompt" 
    },
    { icon: RotateCcw, onClick: onLoadPrompt, tooltip: "Reuse this prompt" },
  ];

  const [activeTab, setActiveTab] = useState('examples');


  useEffect(() => {
    const history = historyManager.getHistory();
    if(history && history.length>0){
        setActiveTab('history');
    }
  }, [history]);

  return (
    <Tabs defaultValue="examples" className="w-full" value={activeTab} 
    onValueChange={(value) => {setActiveTab(value)}}>
         
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="examples">
          <Sparkles className="h-4 w-4 mr-2" />
          Examples
        </TabsTrigger>
        <TabsTrigger value="history">
          <History className="h-4 w-4 mr-2" />
          History
        </TabsTrigger>
      </TabsList>
      
      <TabsContent value="examples" className="mt-4 max-h-[40rem] overflow-auto">
        <div className="space-y-3">
          {examples.map((example, index) => (
            <div
              key={index}
              className="flex items-start gap-4 p-4 rounded-lg border bg-card/50 hover:bg-muted/50 transition-all cursor-pointer group"
              onClick={() => onSelectExample(example)}
            >
              <div className="rounded-full p-2 bg-primary/10 text-primary shrink-0">
                {index === 4 ? <Layout className="h-4 w-4" /> :
                 index === 0 ? <Coffee className="h-4 w-4" /> :
                 index === 1 ? <ImageIcon className="h-4 w-4" /> :
                 index === 2 ? <ShoppingBag className="h-4 w-4" /> :
                 <Table className="h-4 w-4" />}
              </div>
              <p className="text-sm leading-relaxed">{example}</p>
            </div>
          ))}
        </div>
      </TabsContent>

      <TabsContent value="history" className="mt-4 max-h-[40rem] overflow-auto">
        <div className="space-y-3">
          {history.map((version) => (
            <div key={version.id} className="group relative p-4 rounded-lg border bg-card/50 hover:bg-muted/50 transition-all">
              <div className="flex items-start gap-4">
                <div className="rounded-full p-2 bg-primary/10 text-primary shrink-0">
                  <MessageSquare className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium line-clamp-2 mb-1">{version.prompt}</p>
                  <p className="text-xs text-muted-foreground">{new Date(version.timestamp).toLocaleString()}</p>
                </div>
                <TooltipProvider>
                  <div className="flex gap-1 shrink-0">
                    {actionButtons.map(({ icon: Icon, onClick, tooltip }, index) => (
                      <Tooltip key={index}>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 hover:bg-primary/10"
                            onClick={() => onClick(version)}
                          >
                            <Icon className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>{tooltip}</p>
                        </TooltipContent>
                      </Tooltip>
                    ))}
                  </div>
                </TooltipProvider>
              </div>
            </div>
          ))}
        </div>
      </TabsContent>
    </Tabs>
  );
}

// 在文件顶部添加类型定义
interface GenerationVersion {
  id: string;
  prompt: string;
  timestamp: number;
  // 根据实际需要添加其他属性
}

// 或者从类型文件中导入
// import { GenerationVersion } from "@/types/generation";