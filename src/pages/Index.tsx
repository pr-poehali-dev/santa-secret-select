import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import Icon from '@/components/ui/icon';

const SANTA_API = 'https://functions.poehali.dev/cca35df5-c04f-4d6a-b5dc-580871184a95';

const Snowflake = ({ delay }: { delay: number }) => (
  <div 
    className="absolute text-white opacity-70 animate-fall pointer-events-none"
    style={{
      left: `${Math.random() * 100}%`,
      animationDelay: `${delay}s`,
      fontSize: `${Math.random() * 10 + 10}px`
    }}
  >
    ❄️
  </div>
);

export default function Index() {
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [participantCount, setParticipantCount] = useState(0);
  const [result, setResult] = useState<{
    participantName: string;
    giverTo: string | null;
  } | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchParticipantCount();
  }, []);

  const fetchParticipantCount = async () => {
    const response = await fetch(SANTA_API);
    const data = await response.json();
    setParticipantCount(data.participantCount);
  };

  const handleJoin = async () => {
    if (!name.trim()) {
      toast({
        title: 'Ошибка',
        description: 'Пожалуйста, введите ваше имя',
        variant: 'destructive'
      });
      return;
    }

    setLoading(true);
    
    const response = await fetch(SANTA_API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: name.trim() })
    });
    
    const data = await response.json();
    setLoading(false);

    if (response.ok) {
      setResult({
        participantName: data.participantName,
        giverTo: data.giverTo
      });
      fetchParticipantCount();
    } else {
      toast({
        title: 'Ошибка',
        description: data.error || 'Что-то пошло не так',
        variant: 'destructive'
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-100 via-blue-50 to-white relative overflow-hidden">
      {[...Array(20)].map((_, i) => (
        <Snowflake key={i} delay={i * 0.5} />
      ))}
      
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-green-600 to-transparent opacity-20" />
      
      <div className="container mx-auto px-4 py-12 relative z-10">
        <div className="max-w-2xl mx-auto text-center mb-12">
          <div className="flex items-center justify-center gap-3 mb-6">
            <span className="text-6xl animate-pulse">🎅</span>
            <h1 className="text-5xl font-bold text-primary">Тайный Санта</h1>
            <span className="text-6xl animate-pulse">🎄</span>
          </div>
          <p className="text-xl text-muted-foreground">
            Присоединяйтесь к игре и узнайте, кому вы будете дарить подарок!
          </p>
        </div>

        {!result ? (
          <Card className="max-w-md mx-auto shadow-2xl border-2 border-primary/20 bg-white/95 backdrop-blur">
            <CardHeader>
              <CardTitle className="text-2xl text-center">Вход в игру</CardTitle>
              <CardDescription className="text-center">
                Участников в игре: <span className="font-bold text-primary">{participantCount}</span>
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Ваше имя или фамилия</label>
                <Input 
                  placeholder="Например: Иван или Петров"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleJoin()}
                  className="text-lg"
                />
              </div>
              <Button 
                onClick={handleJoin} 
                disabled={loading}
                className="w-full text-lg py-6"
                size="lg"
              >
                {loading ? (
                  <Icon name="Loader2" className="animate-spin mr-2" />
                ) : (
                  <Icon name="Gift" className="mr-2" />
                )}
                {loading ? 'Подключение...' : 'Присоединиться'}
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Card className="max-w-md mx-auto shadow-2xl border-2 border-primary/20 bg-white/95 backdrop-blur">
            <CardHeader>
              <CardTitle className="text-2xl text-center">
                Привет, {result.participantName}! 👋
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {result.giverTo ? (
                <div className="text-center space-y-4">
                  <div className="bg-gradient-to-r from-primary/10 to-secondary/10 p-8 rounded-lg border-2 border-dashed border-primary/30">
                    <p className="text-lg mb-4">Вы дарите подарок для:</p>
                    <p className="text-4xl font-bold text-primary animate-pulse">
                      {result.giverTo}
                    </p>
                    <div className="mt-6 text-5xl">🎁</div>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Это секрет! Никому не говорите 🤫
                  </p>
                </div>
              ) : (
                <div className="text-center space-y-4">
                  <div className="bg-accent/20 p-8 rounded-lg border-2 border-dashed border-accent">
                    <Icon name="Users" className="w-16 h-16 mx-auto mb-4 text-accent-foreground" />
                    <p className="text-lg">
                      Ожидаем больше участников для распределения...
                    </p>
                    <p className="text-sm text-muted-foreground mt-2">
                      Нужно минимум 2 участника
                    </p>
                  </div>
                </div>
              )}
              <Button 
                onClick={() => {
                  setResult(null);
                  setName('');
                  fetchParticipantCount();
                }}
                variant="outline"
                className="w-full"
              >
                <Icon name="ArrowLeft" className="mr-2" />
                Назад
              </Button>
            </CardContent>
          </Card>
        )}

        <div className="mt-12 text-center">
          <div className="inline-flex items-center gap-2 text-6xl">
            <span className="animate-bounce" style={{ animationDelay: '0s' }}>🎄</span>
            <span className="animate-bounce" style={{ animationDelay: '0.1s' }}>✨</span>
            <span className="animate-bounce" style={{ animationDelay: '0.2s' }}>🎁</span>
            <span className="animate-bounce" style={{ animationDelay: '0.3s' }}>⭐</span>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes fall {
          0% {
            transform: translateY(-100px) rotate(0deg);
          }
          100% {
            transform: translateY(100vh) rotate(360deg);
          }
        }
        .animate-fall {
          animation: fall linear infinite;
          animation-duration: 10s;
        }
      `}</style>
    </div>
  );
}
