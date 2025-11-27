const SENSOR_TIMEOUT = 5000;

async function sendCommand(ip: string, endpoint: string): Promise<boolean> {
  const targetIp = ip?.trim();
  if (!targetIp) return false;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), SENSOR_TIMEOUT);

  try {
    const response = await fetch(`http://${targetIp}/${endpoint}`, {
      method: "GET",
      signal: controller.signal,
    });
    return response.ok;
  } catch (error) {
    console.log(`[sensorApi] ${endpoint} failed:`, error);
    return false;
  } finally {
    clearTimeout(timeout);
  }
}

export async function vibrateSensor(ip: string): Promise<boolean> {
  return sendCommand(ip, "vibrate");
}

export async function stopVibration(ip: string): Promise<boolean> {
  return sendCommand(ip, "stopvibrate");
}