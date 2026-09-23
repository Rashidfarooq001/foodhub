import sys
with open('apps/backend/src/modules/orders/orders.repository.ts', 'r', encoding='utf-8') as f:
    content = f.read()

old_repo = '''  async findAll(status?: any, page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    let statusFilter: any = undefined;
    if (typeof status === 'string' && status.includes(',')) {
      statusFilter = { in: status.split(',').map((s) => s.trim()) };
    } else if (status) {
      statusFilter = status;
    }

    return this.prisma.order.findMany({
      where: { ...(statusFilter ? { status: statusFilter } : {}), deletedAt: null },
      include: {'''

new_repo = '''  async findAll(status?: any, search?: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    let statusFilter: any = undefined;
    if (typeof status === 'string' && status.includes(',')) {
      statusFilter = { in: status.split(',').map((s) => s.trim()) };
    } else if (status) {
      statusFilter = status;
    }

    const whereClause: any = { deletedAt: null };
    if (statusFilter) {
      whereClause.status = statusFilter;
    }
    
    if (search) {
      whereClause.OR = [
        { orderNumber: { contains: search, mode: 'insensitive' } },
        { customerName: { contains: search, mode: 'insensitive' } },
        { restaurant: { name: { contains: search, mode: 'insensitive' } } },
        { customer: { profile: { firstName: { contains: search, mode: 'insensitive' } } } },
      ];
    }

    return this.prisma.order.findMany({
      where: whereClause,
      include: {'''

content = content.replace(old_repo, new_repo)

with open('apps/backend/src/modules/orders/orders.repository.ts', 'w', encoding='utf-8') as f:
    f.write(content)
