import prisma from '../config/database';
import { ENV } from '../config/env';

export interface PaymentIntentResult {
  paymentId: string;
  orderId: string;
  amount: number;
  currency: string;
  provider: string;
  status: string;
  instructions: string;
}

export class PaymentService {
  /**
   * Initializes a payment record for an order
   */
  async createPaymentIntent(orderId: string, buyerProfileId: string): Promise<PaymentIntentResult> {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { buyerProfile: true },
    });

    if (!order) throw new Error('Order not found');
    if (order.buyerProfileId !== buyerProfileId) {
      throw new Error('Unauthorized: Order does not belong to this buyer');
    }

    // Check existing payment
    let payment = await prisma.payment.findUnique({
      where: { orderId },
    });

    if (!payment) {
      payment = await prisma.payment.create({
        data: {
          orderId,
          buyerProfileId,
          amount: order.totalPrice,
          currency: 'INR',
          provider: ENV.PAYMENT_PROVIDER,
          status: 'PENDING',
          providerOrderId: `MOCK_ORD_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
        },
      });
    }

    return {
      paymentId: payment.id,
      orderId: order.id,
      amount: payment.amount,
      currency: payment.currency,
      provider: payment.provider,
      status: payment.status,
      instructions:
        ENV.PAYMENT_PROVIDER === 'MOCK'
          ? 'Development Mock Payment Provider: Select simulated UPI / NetBanking / Card to verify flow without incurring real charges.'
          : 'Production Payment Gateway active.',
    };
  }

  /**
   * Completes a mock payment checkout transaction
   */
  async processMockPayment(params: {
    orderId: string;
    buyerUserId: string;
    paymentMethod: 'UPI' | 'NET_BANKING' | 'CARD' | 'ESCROW_WALLET';
    upiId?: string;
  }) {
    const { orderId, buyerUserId, paymentMethod } = params;

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        payment: true,
        buyerProfile: { include: { user: true } },
        items: {
          include: {
            farmerProfile: { include: { user: true } },
          },
        },
      },
    });

    if (!order) throw new Error('Order not found');
    if (order.buyerProfile.userId !== buyerUserId) {
      throw new Error('Unauthorized to pay for this order');
    }

    // Prevent duplicate payment processing
    if (order.payment?.status === 'SUCCESS' || order.status === 'PAID' || order.status === 'COMPLETED') {
      throw new Error('This order has already been paid and secured in escrow.');
    }

    const mockTxRef = `TXN_AGRI_${Date.now()}_${Math.floor(1000 + Math.random() * 9000)}`;

    // Update or create payment record to SUCCESS
    const payment = await prisma.payment.upsert({
      where: { orderId },
      update: {
        status: 'SUCCESS',
        paidAt: new Date(),
        providerPaymentId: `MOCK_PAY_${paymentMethod}_${Date.now()}`,
      },
      create: {
        orderId,
        buyerProfileId: order.buyerProfileId,
        amount: order.totalPrice,
        currency: 'INR',
        provider: 'MOCK',
        status: 'SUCCESS',
        paidAt: new Date(),
        providerPaymentId: `MOCK_PAY_${paymentMethod}_${Date.now()}`,
        providerOrderId: `MOCK_ORD_${Date.now()}`,
      },
    });

    // Create Escrow Hold Transaction
    const transaction = await prisma.transaction.create({
      data: {
        orderId: order.id,
        paymentId: payment.id,
        fromUserId: buyerUserId,
        toUserId: undefined, // Held in platform escrow
        amount: order.totalPrice,
        feeAmount: order.platformFee,
        netAmount: order.totalPrice - order.platformFee,
        type: 'ESCROW_HOLD',
        status: 'COMPLETED',
        referenceNumber: mockTxRef,
      },
    });

    // Update order status: If already delivered, move to PAID / COMPLETED, else PAYMENT_PENDING / PAID
    const nextStatus = order.buyerDeliveryConfirmed ? 'COMPLETED' : 'PAID';

    await prisma.order.update({
      where: { id: order.id },
      data: {
        status: nextStatus,
      },
    });

    // Notify farmers about secured payment in escrow
    for (const item of order.items) {
      await prisma.notification.create({
        data: {
          userId: item.farmerProfile.userId,
          title: 'Payment Secured in Escrow',
          message: `Buyer has deposited ₹${order.totalPrice.toLocaleString('en-IN')} for Order #${order.orderNumber}. Payout will be released upon delivery confirmation.`,
          type: 'PAYMENT',
          actionUrl: `/farmer/orders/${order.id}`,
        },
      });
    }

    return {
      payment,
      transaction,
      orderStatus: nextStatus,
    };
  }

  /**
   * Releases escrow payout to farmers after buyer delivery confirmation
   */
  async releaseEscrowPayout(orderId: string) {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        payment: true,
        items: {
          include: {
            farmerProfile: { include: { user: true } },
          },
        },
      },
    });

    if (!order) throw new Error('Order not found');
    if (!order.buyerDeliveryConfirmed) {
      throw new Error('Cannot release payout before buyer confirms delivery');
    }

    const payoutTransactions = [];

    for (const item of order.items) {
      const ref = `PAYOUT_FARMER_${item.id.slice(0, 6)}_${Date.now()}`;
      const farmerShare = item.subtotal;

      const tx = await prisma.transaction.create({
        data: {
          orderId: order.id,
          paymentId: order.payment?.id,
          fromUserId: undefined, // from platform escrow
          toUserId: item.farmerProfile.userId,
          amount: farmerShare,
          feeAmount: 0,
          netAmount: farmerShare,
          type: 'FARMER_PAYOUT',
          status: 'COMPLETED',
          referenceNumber: ref,
        },
      });

      payoutTransactions.push(tx);

      await prisma.notification.create({
        data: {
          userId: item.farmerProfile.userId,
          title: 'Payment Disbursed to Bank Account',
          message: `Direct payout of ₹${farmerShare.toLocaleString('en-IN')} for ${item.quantity} kg produce has been credited.`,
          type: 'PAYMENT',
          actionUrl: `/farmer/transactions`,
        },
      });
    }

    await prisma.order.update({
      where: { id: order.id },
      data: { status: 'COMPLETED' },
    });

    return payoutTransactions;
  }
}

export const paymentService = new PaymentService();
