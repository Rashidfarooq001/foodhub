import { Test, TestingModule } from '@nestjs/testing';
import { OrdersGateway } from './orders.gateway';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../database/prisma.service';

/**
 * Security tests for handleJoinAdmin — P0 fix BUG-001.
 *
 * The original condition: if (user && user.role !== 'ADMIN' ...)
 * allowed null-user (unauthenticated) to pass the check and join admin:operations.
 *
 * Fix: if (!user) reject; if (role !== ADMIN && role !== SUPER_ADMIN) reject.
 */
describe('OrdersGateway - handleJoinAdmin security', () => {
  let gateway: OrdersGateway;

  const makeSocket = (rooms?: Set<string>): any => {
    const joinedRooms = rooms ?? new Set<string>();
    return {
      id: 'mock-socket-id',
      emit: jest.fn(),
      join: jest.fn().mockImplementation((room: string) => { joinedRooms.add(room); }),
      handshake: { headers: {}, auth: {}, query: {} },
    };
  };

  const mockExtract = (user: { id: string; role: string } | null) =>
    jest.spyOn(gateway as any, 'extractUserFromSocket').mockReturnValue(user);

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrdersGateway,
        { provide: JwtService, useValue: { verify: jest.fn() } },
        { provide: ConfigService, useValue: { get: jest.fn().mockReturnValue('test-secret') } },
        {
          provide: PrismaService,
          useValue: {
            order: { findUnique: jest.fn() },
            driver: { findUnique: jest.fn() },
          },
        },
      ],
    }).compile();
    gateway = module.get<OrdersGateway>(OrdersGateway);
    (gateway as any).server = { to: jest.fn().mockReturnValue({ emit: jest.fn() }) };
  });

  afterEach(() => { jest.restoreAllMocks(); });

  it('TEST 1: anonymous client (no user) is REJECTED', () => {
    mockExtract(null);
    const client = makeSocket();
    const result = gateway.handleJoinAdmin(client, {});
    expect(result.success).toBe(false);
    expect(client.join).not.toHaveBeenCalledWith('admin:operations');
    expect(client.emit).toHaveBeenCalledWith('error', expect.any(Object));
  });

  it('TEST 2: CUSTOMER role is REJECTED', () => {
    mockExtract({ id: 'u1', role: 'CUSTOMER' });
    const client = makeSocket();
    const result = gateway.handleJoinAdmin(client, {});
    expect(result.success).toBe(false);
    expect(client.join).not.toHaveBeenCalledWith('admin:operations');
  });

  it('TEST 3: DELIVERY_PARTNER role is REJECTED', () => {
    mockExtract({ id: 'u2', role: 'DELIVERY_PARTNER' });
    const client = makeSocket();
    expect(gateway.handleJoinAdmin(client, {}).success).toBe(false);
    expect(client.join).not.toHaveBeenCalledWith('admin:operations');
  });

  it('TEST 4: RESTAURANT_OWNER role is REJECTED', () => {
    mockExtract({ id: 'u3', role: 'RESTAURANT_OWNER' });
    const client = makeSocket();
    expect(gateway.handleJoinAdmin(client, {}).success).toBe(false);
    expect(client.join).not.toHaveBeenCalledWith('admin:operations');
  });

  it('TEST 5: RESTAURANT_STAFF role is REJECTED', () => {
    mockExtract({ id: 'u4', role: 'RESTAURANT_STAFF' });
    const client = makeSocket();
    expect(gateway.handleJoinAdmin(client, {}).success).toBe(false);
    expect(client.join).not.toHaveBeenCalledWith('admin:operations');
  });

  it('TEST 6: ADMIN role is ACCEPTED and joins admin:operations', () => {
    mockExtract({ id: 'u5', role: 'ADMIN' });
    const client = makeSocket();
    const result = gateway.handleJoinAdmin(client, {});
    expect(result.success).toBe(true);
    expect(client.join).toHaveBeenCalledWith('admin:operations');
    expect(client.emit).toHaveBeenCalledWith('joinedAdmin', { success: true });
  });

  it('TEST 7: SUPER_ADMIN role is ACCEPTED and joins admin:operations', () => {
    mockExtract({ id: 'u6', role: 'SUPER_ADMIN' });
    const client = makeSocket();
    const result = gateway.handleJoinAdmin(client, {});
    expect(result.success).toBe(true);
    expect(client.join).toHaveBeenCalledWith('admin:operations');
    expect(client.emit).toHaveBeenCalledWith('joinedAdmin', { success: true });
  });

  it('TEST 8: anonymous client room set never contains admin:operations', () => {
    mockExtract(null);
    const rooms = new Set<string>();
    gateway.handleJoinAdmin(makeSocket(rooms), {});
    expect(rooms.has('admin:operations')).toBe(false);
  });

  it('TEST 9: CUSTOMER client room set never contains admin:operations', () => {
    mockExtract({ id: 'u7', role: 'CUSTOMER' });
    const rooms = new Set<string>();
    gateway.handleJoinAdmin(makeSocket(rooms), {});
    expect(rooms.has('admin:operations')).toBe(false);
  });

  it('TEST 10: token from message body is forwarded to extractUserFromSocket', () => {
    const spy = jest.spyOn(gateway as any, 'extractUserFromSocket').mockReturnValue({ id: 'u8', role: 'ADMIN' });
    gateway.handleJoinAdmin(makeSocket(), { token: 'fake.jwt.token' });
    expect(spy).toHaveBeenCalledWith(expect.any(Object), 'fake.jwt.token');
  });

  it('TEST 11: no token and no handshake auth -> extractUser returns null -> rejected', () => {
    jest.restoreAllMocks(); // use real extractUserFromSocket
    const client = makeSocket();
    client.handshake = { headers: {}, auth: {}, query: {} };
    const result = gateway.handleJoinAdmin(client, {});
    expect(result.success).toBe(false);
    expect(client.join).not.toHaveBeenCalledWith('admin:operations');
  });
});