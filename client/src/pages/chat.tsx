import { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useLocation } from 'wouter';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import Navigation from '@/components/ui/navigation';
import { isUnauthorizedError } from '@/lib/authUtils';
import { 
  MessageCircle, 
  Send, 
  Bot, 
  User, 
  Lightbulb,
  Crown,
  Loader2
} from 'lucide-react';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  archetype?: string;
}

export default function Chat() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({
        title: "Unauthorized",
        description: "You need to log in to access AI Chat. Redirecting...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 1500);
      return;
    }
  }, [isAuthenticated, isLoading, toast]);

  // Get reflection questions for the user's archetype
  const { data: reflectionData } = useQuery({
    queryKey: ['/api/reflection-questions'],
    enabled: isAuthenticated,
    retry: false,
  });

  // Chat mutation
  const chatMutation = useMutation({
    mutationFn: async (messageData: { message: string; conversationHistory: any[] }) => {
      const response = await apiRequest("POST", "/api/chat", messageData);
      return response.json();
    },
    onSuccess: (data) => {
      const assistantMessage: ChatMessage = {
        role: 'assistant',
        content: data.response,
        timestamp: data.timestamp,
        archetype: data.archetype
      };
      setMessages(prev => [...prev, assistantMessage]);
      setIsTyping(false);
    },
    onError: (error) => {
      setIsTyping(false);
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || chatMutation.isPending) return;

    const userMessage: ChatMessage = {
      role: 'user',
      content: inputMessage.trim(),
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMessage]);
    setIsTyping(true);
    setInputMessage('');

    // Prepare conversation history for Claude
    const conversationHistory = messages.map(msg => ({
      role: msg.role,
      content: msg.content
    }));

    chatMutation.mutate({
      message: userMessage.content,
      conversationHistory
    });
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleQuestionClick = (question: string) => {
    setInputMessage(question);
    inputRef.current?.focus();
  };

  const getArchetypeBadgeColor = (archetype: string) => {
    const colors: Record<string, string> = {
      pioneer: 'bg-blue-500/20 text-blue-700 dark:text-blue-300',
      organizer: 'bg-green-500/20 text-green-700 dark:text-green-300', 
      builder: 'bg-orange-500/20 text-orange-700 dark:text-orange-300',
      guardian: 'bg-purple-500/20 text-purple-700 dark:text-purple-300'
    };
    return colors[archetype.toLowerCase()] || colors.pioneer;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return null; // Will redirect
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <Navigation />
      
      <div className="container mx-auto px-6 py-24">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-3 mb-4">
              <Bot className="w-8 h-8 text-yellow-400" />
              <h1 className="text-4xl font-bold bg-gradient-to-r from-yellow-400 to-amber-600 bg-clip-text text-transparent">
                Biblical AI Coach
              </h1>
            </div>
            <p className="text-gray-300 text-lg max-w-2xl mx-auto">
              Get personalized biblical leadership guidance powered by Claude AI. 
              Ask questions, seek wisdom, and grow in your calling.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Chat Interface */}
            <div className="lg:col-span-2">
              <Card className="bg-gray-900/50 border-gray-800 h-[600px] flex flex-col">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-2 text-white">
                    <MessageCircle className="w-5 h-5" />
                    Chat with Your Biblical Coach
                  </CardTitle>
                </CardHeader>
                
                <CardContent className="flex-1 flex flex-col p-0">
                  {/* Messages */}
                  <ScrollArea className="flex-1 px-6">
                    <div className="space-y-4 pb-4">
                      {messages.length === 0 && (
                        <div className="text-center py-12 text-gray-400">
                          <Bot className="w-12 h-12 mx-auto mb-4 text-yellow-400" />
                          <p className="text-lg mb-2">Welcome to your Biblical AI Coach!</p>
                          <p className="text-sm">
                            Ask me anything about leadership, biblical wisdom, or your spiritual journey.
                          </p>
                        </div>
                      )}
                      
                      {messages.map((message, index) => (
                        <div key={index} className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                          <div className={`flex gap-3 max-w-[80%] ${message.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${message.role === 'user' ? 'bg-blue-600' : 'bg-yellow-600'}`}>
                              {message.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                            </div>
                            <div className={`rounded-lg p-4 ${message.role === 'user' ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-100'}`}>
                              <div className="whitespace-pre-wrap">{message.content}</div>
                              {message.archetype && (
                                <div className="mt-2">
                                  <Badge className={getArchetypeBadgeColor(message.archetype)}>
                                    {message.archetype}
                                  </Badge>
                                </div>
                              )}
                              <div className="text-xs opacity-70 mt-2">
                                {new Date(message.timestamp).toLocaleTimeString()}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                      
                      {isTyping && (
                        <div className="flex gap-3">
                          <div className="w-8 h-8 rounded-full bg-yellow-600 flex items-center justify-center">
                            <Bot className="w-4 h-4" />
                          </div>
                          <div className="bg-gray-800 rounded-lg p-4">
                            <div className="flex items-center gap-2">
                              <Loader2 className="w-4 h-4 animate-spin" />
                              <span className="text-gray-400">Thinking...</span>
                            </div>
                          </div>
                        </div>
                      )}
                      
                      <div ref={messagesEndRef} />
                    </div>
                  </ScrollArea>
                  
                  {/* Input */}
                  <div className="border-t border-gray-800 p-6">
                    <div className="flex gap-2">
                      <Input
                        ref={inputRef}
                        value={inputMessage}
                        onChange={(e) => setInputMessage(e.target.value)}
                        onKeyPress={handleKeyPress}
                        placeholder="Ask me about biblical leadership, spiritual growth, or seek guidance..."
                        className="flex-1 bg-gray-800 border-gray-700 text-white"
                        data-testid="input-chat-message"
                      />
                      <Button 
                        onClick={handleSendMessage}
                        disabled={!inputMessage.trim() || chatMutation.isPending}
                        className="bg-yellow-600 hover:bg-yellow-700"
                        data-testid="button-send-message"
                      >
                        <Send className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Reflection Questions */}
              {(reflectionData as any)?.questions && (
                <Card className="bg-gray-900/50 border-gray-800">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-white">
                      <Lightbulb className="w-5 h-5 text-yellow-400" />
                      Reflection Questions
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {(reflectionData as any).questions.map((question: string, index: number) => (
                      <button
                        key={index}
                        onClick={() => handleQuestionClick(question)}
                        className="w-full text-left p-3 rounded-lg bg-gray-800/50 hover:bg-gray-700/50 transition-colors text-sm text-gray-300 hover:text-white"
                        data-testid={`button-question-${index}`}
                      >
                        {question}
                      </button>
                    ))}
                  </CardContent>
                </Card>
              )}

              {/* User Archetype */}
              <Card className="bg-gray-900/50 border-gray-800">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-white">
                    <Crown className="w-5 h-5 text-yellow-400" />
                    Your Leadership Type
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center">
                    {(user as any)?.archetype ? (
                      <Badge className={`${getArchetypeBadgeColor((user as any).archetype)} text-lg px-4 py-2`}>
                        {(user as any).archetype}
                      </Badge>
                    ) : (
                      <div className="text-gray-400">
                        <p className="mb-2">Complete your assessment to discover your biblical leadership archetype!</p>
                        <Button variant="outline" size="sm" onClick={() => setLocation('/assessment')}>
                          Take Assessment
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Quick Tips */}
              <Card className="bg-gray-900/50 border-gray-800">
                <CardHeader>
                  <CardTitle className="text-white">Chat Tips</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm text-gray-400">
                  <p>• Ask specific questions about leadership challenges</p>
                  <p>• Seek biblical guidance for difficult decisions</p>
                  <p>• Request archetype-specific development advice</p>
                  <p>• Explore Pattern Manifesto principles</p>
                  <p>• Share your spiritual growth journey</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}