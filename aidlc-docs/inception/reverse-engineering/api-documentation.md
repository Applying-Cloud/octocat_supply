# API Documentation

## REST APIs

### Suppliers

#### GET /api/suppliers
- **Method**: GET
- **Path**: `/api/suppliers`
- **Purpose**: List all suppliers
- **Request**: None
- **Response**: `Supplier[]`

#### POST /api/suppliers
- **Method**: POST
- **Path**: `/api/suppliers`
- **Purpose**: Create a new supplier
- **Request**: `{ name, description, contactPerson, email, phone }`
- **Response**: `Supplier` (201 Created)

#### GET /api/suppliers/:id
- **Method**: GET
- **Path**: `/api/suppliers/:id`
- **Purpose**: Get supplier by ID
- **Request**: Path param `id` (integer)
- **Response**: `Supplier` or 404

#### PUT /api/suppliers/:id
- **Method**: PUT
- **Path**: `/api/suppliers/:id`
- **Purpose**: Update supplier
- **Request**: Partial supplier fields
- **Response**: `Supplier` or 404

#### DELETE /api/suppliers/:id
- **Method**: DELETE
- **Path**: `/api/suppliers/:id`
- **Purpose**: Delete supplier
- **Request**: Path param `id`
- **Response**: 204 No Content or 404

#### GET /api/suppliers/:id/status
- **Method**: GET
- **Path**: `/api/suppliers/:id/status`
- **Purpose**: Get supplier verification/active status
- **Request**: Path param `id`
- **Response**: `{ status: "APPROVED" | "PENDING" | "INACTIVE" }`

### Products

#### GET /api/products
- **Method**: GET
- **Path**: `/api/products`
- **Purpose**: List all products
- **Response**: `Product[]`

#### POST /api/products
- **Method**: POST
- **Path**: `/api/products`
- **Purpose**: Create product
- **Request**: `{ supplierId, name, description, price, sku, unit, imgName, discount? }`
- **Response**: `Product` (201)

#### GET /api/products/:id
- **Method**: GET
- **Path**: `/api/products/:id`
- **Purpose**: Get product by ID
- **Response**: `Product` or 404

#### PUT /api/products/:id
- **Method**: PUT
- **Path**: `/api/products/:id`
- **Purpose**: Update product
- **Request**: Partial product fields
- **Response**: `Product` or 404

#### DELETE /api/products/:id
- **Method**: DELETE
- **Path**: `/api/products/:id`
- **Purpose**: Delete product
- **Response**: 204 or 404

### Orders

#### GET /api/orders
- **Method**: GET
- **Path**: `/api/orders`
- **Purpose**: List all orders
- **Response**: `Order[]`

#### POST /api/orders
- **Method**: POST
- **Path**: `/api/orders`
- **Purpose**: Create order
- **Request**: `{ branchId, orderDate, name, description, status? }`
- **Response**: `Order` (201)

#### GET /api/orders/:id
- **Method**: GET
- **Path**: `/api/orders/:id`
- **Purpose**: Get order by ID
- **Response**: `Order` or 404

#### PUT /api/orders/:id
- **Method**: PUT
- **Path**: `/api/orders/:id`
- **Purpose**: Update order
- **Response**: `Order` or 404

#### DELETE /api/orders/:id
- **Method**: DELETE
- **Path**: `/api/orders/:id`
- **Purpose**: Delete order
- **Response**: 204 or 404

### Order Details

#### GET /api/order-details
- **Method**: GET
- **Path**: `/api/order-details`
- **Purpose**: List all order details
- **Response**: `OrderDetail[]`

#### POST /api/order-details
- **Method**: POST
- **Path**: `/api/order-details`
- **Purpose**: Create order detail
- **Request**: `{ orderId, productId, quantity, unitPrice, notes }`
- **Response**: `OrderDetail` (201)

#### GET /api/order-details/:id
- **Method**: GET
- **Path**: `/api/order-details/:id`
- **Purpose**: Get order detail by ID
- **Response**: `OrderDetail` or 404

#### PUT /api/order-details/:id
- **Method**: PUT
- **Path**: `/api/order-details/:id`
- **Purpose**: Update order detail
- **Response**: `OrderDetail` or 404

#### DELETE /api/order-details/:id
- **Method**: DELETE
- **Path**: `/api/order-details/:id`
- **Purpose**: Delete order detail
- **Response**: 204 or 404

### Deliveries

#### GET /api/deliveries
- **Method**: GET
- **Path**: `/api/deliveries`
- **Purpose**: List all deliveries
- **Response**: `Delivery[]`

#### POST /api/deliveries
- **Method**: POST
- **Path**: `/api/deliveries`
- **Purpose**: Create delivery
- **Request**: `{ supplierId, deliveryDate, name, description, status? }`
- **Response**: `Delivery` (201)

#### GET /api/deliveries/:id
- **Method**: GET
- **Path**: `/api/deliveries/:id`
- **Purpose**: Get delivery by ID
- **Response**: `Delivery` or 404

#### PUT /api/deliveries/:id
- **Method**: PUT
- **Path**: `/api/deliveries/:id`
- **Purpose**: Update delivery
- **Response**: `Delivery` or 404

#### PUT /api/deliveries/:id/status
- **Method**: PUT
- **Path**: `/api/deliveries/:id/status`
- **Purpose**: Update delivery status with optional notification
- **Request**: `{ status, deliveryPartner? }`
- **Response**: `Delivery` or `{ delivery, commandOutput }` (if deliveryPartner provided)

#### DELETE /api/deliveries/:id
- **Method**: DELETE
- **Path**: `/api/deliveries/:id`
- **Purpose**: Delete delivery
- **Response**: 204 or 404

### Headquarters

#### GET /api/headquarters
- **Method**: GET
- **Path**: `/api/headquarters`
- **Purpose**: List all headquarters
- **Response**: `Headquarters[]`

#### POST /api/headquarters
- **Method**: POST
- **Path**: `/api/headquarters`
- **Purpose**: Create headquarters
- **Request**: `{ name, description, address, contactPerson, email, phone, city?, country?, floorCount?, capacity? }`
- **Response**: `Headquarters` (201)

#### GET /api/headquarters/:id
- **Method**: GET
- **Path**: `/api/headquarters/:id`
- **Purpose**: Get headquarters by ID
- **Response**: `Headquarters` or 404

#### PUT /api/headquarters/:id
- **Method**: PUT
- **Path**: `/api/headquarters/:id`
- **Purpose**: Update headquarters
- **Response**: `Headquarters` or 404

#### DELETE /api/headquarters/:id
- **Method**: DELETE
- **Path**: `/api/headquarters/:id`
- **Purpose**: Delete headquarters
- **Response**: 204 or 404

#### GET /api/headquarters/:id/metrics
- **Method**: GET
- **Path**: `/api/headquarters/:id/metrics`
- **Purpose**: Calculate headquarters metrics
- **Response**: `{ score, average, display }`

#### GET /api/headquarters/:id/label
- **Method**: GET
- **Path**: `/api/headquarters/:id/label`
- **Purpose**: Get headquarters label
- **Response**: `{ label: string }`

### Branches

#### GET /api/branches
- **Method**: GET
- **Path**: `/api/branches`
- **Purpose**: List all branches
- **Response**: `Branch[]`

#### POST /api/branches
- **Method**: POST
- **Path**: `/api/branches`
- **Purpose**: Create branch
- **Request**: `{ headquartersId, name, description, address, contactPerson, email, phone }`
- **Response**: `Branch` (201)

#### GET /api/branches/:id
- **Method**: GET
- **Path**: `/api/branches/:id`
- **Purpose**: Get branch by ID
- **Response**: `Branch` or 404

#### PUT /api/branches/:id
- **Method**: PUT
- **Path**: `/api/branches/:id`
- **Purpose**: Update branch
- **Response**: `Branch` or 404

#### DELETE /api/branches/:id
- **Method**: DELETE
- **Path**: `/api/branches/:id`
- **Purpose**: Delete branch
- **Response**: 204 or 404

### Order Detail Deliveries

#### GET /api/order-detail-deliveries
- **Method**: GET
- **Path**: `/api/order-detail-deliveries`
- **Purpose**: List all order-detail-delivery junctions
- **Response**: `OrderDetailDelivery[]`

#### POST /api/order-detail-deliveries
- **Method**: POST
- **Path**: `/api/order-detail-deliveries`
- **Purpose**: Create junction record
- **Request**: `{ orderDetailId, deliveryId, quantity, notes }`
- **Response**: `OrderDetailDelivery` (201)

#### GET /api/order-detail-deliveries/:id
- **Method**: GET
- **Path**: `/api/order-detail-deliveries/:id`
- **Purpose**: Get junction by ID
- **Response**: `OrderDetailDelivery` or 404

#### PUT /api/order-detail-deliveries/:id
- **Method**: PUT
- **Path**: `/api/order-detail-deliveries/:id`
- **Purpose**: Update junction
- **Response**: `OrderDetailDelivery` or 404

#### DELETE /api/order-detail-deliveries/:id
- **Method**: DELETE
- **Path**: `/api/order-detail-deliveries/:id`
- **Purpose**: Delete junction
- **Response**: 204 or 404

## Internal APIs

### DatabaseConnection Interface
- **Methods**:
  - `run(sql: string, params?: unknown[]): Promise<{ lastID?: number; changes?: number }>`
  - `get<T>(sql: string, params?: unknown[]): Promise<T | undefined>`
  - `all<T>(sql: string, params?: unknown[]): Promise<T[]>`
  - `close(): Promise<void>`

### Repository Interface (common pattern)
- **Methods**:
  - `findAll(): Promise<T[]>`
  - `findById(id: number): Promise<T | null>`
  - `create(data: Omit<T, 'entityId'>): Promise<T>`
  - `update(id: number, data: Partial<T>): Promise<T>`
  - `delete(id: number): Promise<void>`
  - `exists(id: number): Promise<boolean>`

### SQL Utilities
- `buildInsertSQL<T>(table: string, data: T): { sql: string, values: unknown[] }`
- `buildUpdateSQL<T>(table: string, data: T, whereClause: string): { sql: string, values: unknown[] }`
- `objectToCamelCase<T>(row: DatabaseRow): T`
- `mapDatabaseRows<T>(rows: DatabaseRow[]): T[]`
- `toSnakeCase(str: string): string`
- `toCamelCase(str: string): string`
- `validateRequiredFields(obj: object, requiredFields: string[]): void`

## Data Models

### Supplier
- **Fields**: supplierId (number, PK), name (string), description (string), contactPerson (string), email (string), phone (string), active (boolean), verified (boolean)
- **Relationships**: Has many Products, Has many Deliveries
- **Validation**: None explicit in model (handled at DB level)

### Product
- **Fields**: productId (number, PK), supplierId (number, FK), name (string), description (string), price (number), sku (string), unit (string), imgName (string), discount (number, optional)
- **Relationships**: Belongs to Supplier, Referenced by OrderDetail
- **Validation**: None explicit

### Order
- **Fields**: orderId (number, PK), branchId (number, FK), orderDate (string), name (string), description (string), status (string, default: "pending")
- **Relationships**: Belongs to Branch, Has many OrderDetails
- **Validation**: None explicit

### OrderDetail
- **Fields**: orderDetailId (number, PK), orderId (number, FK), productId (number, FK), quantity (number), unitPrice (number), notes (string)
- **Relationships**: Belongs to Order, References Product, Has many OrderDetailDeliveries
- **Validation**: None explicit

### Delivery
- **Fields**: deliveryId (number, PK), supplierId (number, FK), deliveryDate (string), name (string), description (string), status (string, default: "pending")
- **Relationships**: Belongs to Supplier, Has many OrderDetailDeliveries
- **Validation**: None explicit

### Headquarters
- **Fields**: headquartersId (number, PK), name (string), description (string), address (string), contactPerson (string), email (string), phone (string), city (string, optional), country (string, optional), floorCount (number, optional), capacity (number, optional)
- **Relationships**: Has many Branches
- **Validation**: None explicit

### Branch
- **Fields**: branchId (number, PK), headquartersId (number, FK), name (string), description (string), address (string), contactPerson (string), email (string), phone (string)
- **Relationships**: Belongs to Headquarters, Has many Orders
- **Validation**: None explicit

### OrderDetailDelivery
- **Fields**: orderDetailDeliveryId (number, PK), orderDetailId (number, FK), deliveryId (number, FK), quantity (number), notes (string)
- **Relationships**: Belongs to OrderDetail, Belongs to Delivery
- **Validation**: None explicit
