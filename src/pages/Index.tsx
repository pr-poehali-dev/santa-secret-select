import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import Icon from '@/components/ui/icon';

const SANTA_API = 'https://functions.poehali.dev/cca35df5-c04f-4d6a-b5dc-580871184a95';

const Snowflake = ({ delay, duration, left }: { delay: number; duration: number; left: number }) => (
  <div 
    className="snowflake text-2xl"
    style={{
      left: `${left}%`,
      animationDelay: `${delay}s`,
      animationDuration: `${duration}s`
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
    try {
      const response = await fetch(SANTA_API);
      const data = await response.json();
      setParticipantCount(data.participantCount);
    } catch (error) {
      console.error('Failed to fetch participant count', error);
    }
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
    
    try {
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
    } catch (error) {
      setLoading(false);
      toast({
        title: 'Ошибка',
        description: 'Не удалось подключиться к серверу',
        variant: 'destructive'
      });
    }
  };

  const snowflakes = Array.from({ length: 50 }, (_, i) => ({
    id: i,
    delay: Math.random() * 10,
    duration: 10 + Math.random() * 20,
    left: Math.random() * 100
  }));

  return (
    <div className="min-h-screen relative overflow-hidden">
      {snowflakes.map((flake) => (
        <Snowflake 
          key={flake.id} 
          delay={flake.delay} 
          duration={flake.duration}
          left={flake.left}
        />
      ))}
      
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-10 left-10 text-8xl opacity-20">🎄</div>
        <div className="absolute top-20 right-20 text-6xl opacity-20">⭐</div>
        <div className="absolute bottom-20 left-20 text-7xl opacity-20">🎁</div>
        <div className="absolute bottom-40 right-10 text-8xl opacity-20">🎄</div>
      </div>
      
      <div className="container mx-auto px-4 py-12 relative z-10">
        <div className="max-w-2xl mx-auto text-center mb-12">
          <div className="flex items-center justify-center gap-3 mb-6">
            <span className="text-6xl">🎅</span>
            <h1 className="text-5xl font-bold text-primary">Тайный Санта</h1>
            <span className="text-6xl">🎄</span>
          </div>
          <p className="text-xl text-muted-foreground">
            Присоединяйтесь к игре и узнайте, кому вы будете дарить подарок!
          </p>
        </div>

        {!result ? (
          <Card className="max-w-md mx-auto shadow-2xl border-2">
            <CardHeader>
              <CardTitle className="text-2xl text-center flex items-center justify-center gap-2">
                <Icon name="Gift" className="text-primary" />
                Вход в игру
              </CardTitle>
              <CardDescription className="text-center text-base">
                Участников в игре: <span className="font-bold text-primary text-lg">{participantCount}</span>
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
                  <>
                    <Icon name="Loader2" className="animate-spin mr-2" />
                    Подключение...
                  </>
                ) : (
                  <>
                    <Icon name="Sparkles" className="mr-2" />
                    Присоединиться
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Card className="max-w-md mx-auto shadow-2xl border-2">
            <CardHeader>
              <CardTitle className="text-2xl text-center">
                Привет, {result.participantName}! 👋
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {result.giverTo ? (
                <div className="text-center space-y-4">
                  <div className="bg-primary/10 p-8 rounded-lg border-2 border-dashed border-primary/50">
                    <p className="text-lg mb-4 text-muted-foreground">Вы дарите подарок для:</p>
                    <p className="text-4xl font-bold text-primary mb-4">
                      {result.giverTo}
                    </p>
                    <div className="text-5xl">🎁</div>
                  </div>
                  <div className="bg-secondary/10 p-4 rounded-lg border border-secondary/30">
                    <p className="text-sm flex items-center justify-center gap-2">
                      <span className="text-xl">🤫</span>
                      <span>Это секрет! Никому не говорите</span>
                    </p>
                  </div>
                </div>
              ) : (
                <div className="text-center space-y-4">
                  <div className="bg-muted p-8 rounded-lg border-2 border-dashed">
                    <Icon name="Users" className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                    <p className="text-lg mb-2">
                      Ожидаем больше участников для распределения...
                    </p>
                    <p className="text-sm text-muted-foreground">
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
          <div className="inline-flex items-center gap-3 text-5xl">
            <span>🎄</span>
            <span>✨</span>
            <span>🎁</span>
            <span>⭐</span>
            <span>🎅</span>
          </div>
          <p className="mt-4 text-muted-foreground">Счастливого Нового Года!</p>
        </div>
      </div>
    </div>
  );
}
