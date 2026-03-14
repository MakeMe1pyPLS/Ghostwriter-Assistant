export interface SqlConnectionConfig {
  host: string;
  port: number;
  database: string;
  username: string;
  password: string;
  dbType: 'postgresql' | 'mysql';
}

export interface SqlTestResult {
  success: boolean;
  message: string;
  tables?: string[];
}

export async function testSqlConnection(config: SqlConnectionConfig): Promise<SqlTestResult> {
  if (!config.host || !config.database || !config.username) {
    return { success: false, message: 'Missing required connection fields (host, database, username).' };
  }

  const mockTables = [
    'orders', 'products', 'customers', 'inventory',
    'shipments', 'suppliers', 'returns', 'warehouses'
  ];

  return {
    success: true,
    message: `Connected to ${config.dbType} at ${config.host}:${config.port}/${config.database}`,
    tables: mockTables
  };
}

export async function fetchTableSchema(config: SqlConnectionConfig, tableName: string) {
  const schemas: Record<string, any[]> = {
    orders: [
      { column: 'order_id', type: 'integer', nullable: false },
      { column: 'customer_id', type: 'integer', nullable: false },
      { column: 'total_amount', type: 'decimal', nullable: false },
      { column: 'status', type: 'varchar', nullable: false },
      { column: 'created_at', type: 'timestamp', nullable: false },
    ],
    products: [
      { column: 'product_id', type: 'integer', nullable: false },
      { column: 'name', type: 'varchar', nullable: false },
      { column: 'category', type: 'varchar', nullable: true },
      { column: 'price', type: 'decimal', nullable: false },
      { column: 'stock_qty', type: 'integer', nullable: false },
    ],
    customers: [
      { column: 'customer_id', type: 'integer', nullable: false },
      { column: 'name', type: 'varchar', nullable: false },
      { column: 'email', type: 'varchar', nullable: false },
      { column: 'region', type: 'varchar', nullable: true },
      { column: 'lifetime_value', type: 'decimal', nullable: false },
    ],
    inventory: [
      { column: 'sku', type: 'varchar', nullable: false },
      { column: 'product_name', type: 'varchar', nullable: false },
      { column: 'quantity', type: 'integer', nullable: false },
      { column: 'warehouse', type: 'varchar', nullable: false },
      { column: 'reorder_point', type: 'integer', nullable: false },
    ]
  };

  return schemas[tableName] || [
    { column: 'id', type: 'integer', nullable: false },
    { column: 'name', type: 'varchar', nullable: false },
    { column: 'value', type: 'decimal', nullable: true },
  ];
}

export async function importTableData(config: SqlConnectionConfig, tableName: string) {
  const mockData: Record<string, any[]> = {
    orders: Array.from({ length: 25 }, (_, i) => ({
      order_id: 1001 + i,
      customer_id: 200 + (i % 8),
      total_amount: Math.round(50 + Math.random() * 450),
      status: ['completed', 'processing', 'shipped', 'delivered'][i % 4],
      created_at: `2026-03-${String(1 + (i % 28)).padStart(2, '0')}`
    })),
    products: Array.from({ length: 20 }, (_, i) => ({
      product_id: 5001 + i,
      name: `Product ${String.fromCharCode(65 + i)}`,
      category: ['Electronics', 'Apparel', 'Food', 'Home'][i % 4],
      price: Math.round(10 + Math.random() * 200),
      stock_qty: Math.round(20 + Math.random() * 500)
    })),
    customers: Array.from({ length: 15 }, (_, i) => ({
      customer_id: 200 + i,
      name: `Customer ${i + 1}`,
      email: `customer${i + 1}@example.com`,
      region: ['North', 'South', 'East', 'West'][i % 4],
      lifetime_value: Math.round(500 + Math.random() * 5000)
    })),
    inventory: Array.from({ length: 20 }, (_, i) => ({
      sku: `SKU-${String(i + 1).padStart(4, '0')}`,
      product_name: `Widget ${String.fromCharCode(65 + i)}`,
      quantity: Math.round(10 + Math.random() * 400),
      warehouse: ['WH-East', 'WH-West', 'WH-Central'][i % 3],
      reorder_point: Math.round(20 + Math.random() * 50)
    }))
  };

  return mockData[tableName] || Array.from({ length: 10 }, (_, i) => ({
    id: i + 1,
    name: `Record ${i + 1}`,
    value: Math.round(Math.random() * 1000)
  }));
}