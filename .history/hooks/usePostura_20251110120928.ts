export function usePostura(espIp: string) {
  const { connected, lectura } = useWifiSensor(espIp);
  const [posturaCorrecta, setPosturaCorrecta] = useState(true);
  const [activaciones, setActivaciones] = useState(0);
  const [minutos, setMinutos] = useState(0);

  useEffect(() => {
    if (!lectura) return;
    const { x, y } = lectura;
    const correcta = Math.abs(x) < 10 && Math.abs(y) < 10;
    if (!correcta) setActivaciones(a => a + 1);
    setPosturaCorrecta(correcta);
  }, [lectura]);

  useEffect(() => {
    const timer = setInterval(() => setMinutos(m => m + 1), 60000);
    return () => clearInterval(timer);
  }, []);

  return { connected, posturaCorrecta, activaciones, minutos };
}
