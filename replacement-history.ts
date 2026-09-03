  async getSettlementHistory(restaurantId: string) {
    const settlements = await this.prisma.restaurantSettlement.findMany({
      where: { restaurantId },
      orderBy: { periodStart: 'desc' },
    });

    const weeks = new Map();
    for (const s of settlements) {
      // Create a weekly key based on the start of the week for s.periodStart
      const date = new Date(s.periodStart);
      const day = date.getDay();
      const diff = date.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
      const startOfWeek = new Date(date.setDate(diff));
      startOfWeek.setHours(0, 0, 0, 0);
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(endOfWeek.getDate() + 6);
      endOfWeek.setHours(23, 59, 59, 999);

      const key = startOfWeek.toISOString();

      if (!weeks.has(key)) {
        weeks.set(key, {
          id: \atch-\\,
          periodStart: startOfWeek.toISOString(),
          periodEnd: endOfWeek.toISOString(),
          orderCount: 0,
          grossAmount: 0,
          commissionAmount: 0,
          netPayable: 0,
          status: 'PAID', // Will be PENDING if any are PENDING
          utrNumber: null,
        });
      }

      const entry = weeks.get(key);
      entry.orderCount++;
      entry.grossAmount += Number(s.grossAmount);
      entry.commissionAmount += Number(s.commissionAmount);
      entry.netPayable += Number(s.netPayable);
      if (s.status === 'PENDING' || s.status === 'ELIGIBLE') {
        entry.status = 'PENDING';
      }
      if (s.utrNumber && !entry.utrNumber) {
        entry.utrNumber = s.utrNumber;
      }
    }

    return Array.from(weeks.values()).sort((a, b) => new Date(b.periodStart).getTime() - new Date(a.periodStart).getTime());
  }
