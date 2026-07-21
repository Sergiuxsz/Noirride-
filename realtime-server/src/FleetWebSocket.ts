import { getFirestore } from 'firebase-admin/firestore';
import { Server as HttpServer } from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import { createClient } from 'redis';
import { fleetEvents, FleetManager } from './FleetManager';

export class FleetWebSocket {
  private wss: WebSocketServer;

  constructor(server: HttpServer) {
    // Mount standard WebSocket server on the /ws/fleet path
    this.wss = new WebSocketServer({ server, path: '/ws/fleet' });
    this.setupListeners();
    this.setupLocalEventSubscription();
    this.setupRedisSubscription();
  }

  private setupListeners() {
    this.wss.on('connection', (ws: WebSocket) => {
      console.log('[FleetWebSocket] Client connected');

      ws.on('error', (err) => {
        console.error('[FleetWebSocket] Client error:', err);
      });

      ws.on('message', async (message: string) => {
        try {
          const payload = JSON.parse(message.toString());
          
          // Mutations are now fully handled by the REST API (Single Source of Truth)
        } catch (err) {
           console.error('[FleetWebSocket] error handling message:', err);
        }
      });

      ws.on('close', () => {
        console.log('[FleetWebSocket] Client disconnected');
      });
    });
  }

  public broadcast(message: string) {
    this.wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    });
  }

  private setupLocalEventSubscription() {
    fleetEvents.on('status_change', (data) => {
      const payload = JSON.stringify({
        type: 'STATUS_CHANGE',
        driverId: data.driverId,
        status: data.status
      });
      this.broadcast(payload);
    });

  }

  private async setupRedisSubscription() {
    const url = process.env.REDIS_URL || 'rediss://default:AZV2AAIgcDE3M2YwMjNjMDg3MDE0NGRlYmM4YzVkNjNkYzBjOWUxOA@master-blowfish-38262.upstash.io:6379';
    try {
      const socketOptions: any = {};
      if (url.startsWith('rediss://')) {
        socketOptions.tls = true;
        socketOptions.rejectUnauthorized = false;
      }
      const subscriber = createClient({ url, socket: socketOptions });
      subscriber.on('error', (err: any) => {
        // Log warning without crashing process
      });
      await subscriber.connect();
      await subscriber.subscribe('fleet_updates', (message: string) => {
        try {
          this.broadcast(message);
          const parsed = JSON.parse(message);
          if (parsed.type === 'STATUS_CHANGE') {
            FleetManager.syncDriverStatus(parsed.driverId, parsed.status);
          }
        } catch (err) {
          console.error('[FleetWebSocket] Broadcast error:', err);
        }
      });
      console.log('[FleetWebSocket] Subscribed to Redis channel "fleet_updates" via TCP');
    } catch (err: any) {
      console.warn('[FleetWebSocket] Redis TCP subscription notice (using local event bus fallback):', err.message || err);
    }
  }
}
