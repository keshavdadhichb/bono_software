-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'MANAGER', 'DATA_ENTRY', 'VIEWER');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "email" TEXT,
    "role" "Role" NOT NULL DEFAULT 'DATA_ENTRY',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastLogin" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "companies" (
    "id" TEXT NOT NULL,
    "companyName" TEXT NOT NULL,
    "addressLine1" TEXT,
    "addressLine2" TEXT,
    "city" TEXT,
    "state" TEXT,
    "pincode" TEXT,
    "country" TEXT DEFAULT 'India',
    "gstNo" TEXT,
    "panNo" TEXT,
    "phoneNo" TEXT,
    "email" TEXT,
    "logoUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "companies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "financial_years" (
    "id" TEXT NOT NULL,
    "yearCode" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "financial_years_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "parties" (
    "id" TEXT NOT NULL,
    "partyCode" TEXT,
    "partyName" TEXT NOT NULL,
    "partyType" TEXT NOT NULL,
    "address1" TEXT,
    "address2" TEXT,
    "address3" TEXT,
    "address4" TEXT,
    "district" TEXT,
    "state" TEXT,
    "pincode" TEXT,
    "phone" TEXT,
    "mobile" TEXT,
    "email" TEXT,
    "gstNo" TEXT,
    "panNo" TEXT,
    "bankName" TEXT,
    "bankAccountNo" TEXT,
    "bankIfscCode" TEXT,
    "creditDays" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "parties_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "stores" (
    "id" TEXT NOT NULL,
    "storeName" TEXT NOT NULL,
    "storeLocation" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "stores_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "processes" (
    "id" TEXT NOT NULL,
    "processName" TEXT NOT NULL,
    "processCategory" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "processes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "uoms" (
    "id" TEXT NOT NULL,
    "uomCode" TEXT NOT NULL,
    "description" TEXT,

    CONSTRAINT "uoms_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "colors" (
    "id" TEXT NOT NULL,
    "colorCode" TEXT,
    "colorName" TEXT NOT NULL,

    CONSTRAINT "colors_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "concerns" (
    "id" TEXT NOT NULL,
    "concernName" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "concerns_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "style_numbers" (
    "id" TEXT NOT NULL,
    "styleNo" TEXT NOT NULL,
    "styleReference" TEXT,
    "styleType" TEXT,
    "description" TEXT,

    CONSTRAINT "style_numbers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "gst_tax_slabs" (
    "id" TEXT NOT NULL,
    "taxName" TEXT NOT NULL,
    "cgstRate" DOUBLE PRECISION NOT NULL,
    "sgstRate" DOUBLE PRECISION NOT NULL,
    "hsnCode" TEXT,

    CONSTRAINT "gst_tax_slabs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "yarn_types" (
    "id" TEXT NOT NULL,
    "typeName" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "yarn_types_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "yarn_counts" (
    "id" TEXT NOT NULL,
    "countName" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "yarn_counts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "yarn_masters" (
    "id" TEXT NOT NULL,
    "yarnType" TEXT NOT NULL,
    "counts" TEXT NOT NULL,
    "millName" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "yarn_masters_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "yarn_stock" (
    "id" TEXT NOT NULL,
    "storeId" TEXT NOT NULL,
    "lotNo" TEXT NOT NULL,
    "styleNo" TEXT,
    "counts" TEXT NOT NULL,
    "yarnType" TEXT NOT NULL,
    "millName" TEXT,
    "color" TEXT,
    "dyeColor" TEXT,
    "stockKgs" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "noOfBags" INTEGER NOT NULL DEFAULT 0,
    "uom" TEXT NOT NULL DEFAULT 'Kgs',
    "rate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "process" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "yarn_stock_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "yarn_purchase_orders" (
    "id" TEXT NOT NULL,
    "poNo" TEXT NOT NULL,
    "poDate" TIMESTAMP(3) NOT NULL,
    "partyId" TEXT NOT NULL,
    "storeId" TEXT,
    "narration" TEXT,
    "totalQty" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "gstAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "netAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'Open',
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "yarn_purchase_orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "yarn_purchase_order_items" (
    "id" TEXT NOT NULL,
    "poId" TEXT NOT NULL,
    "slNo" INTEGER NOT NULL,
    "lotNo" TEXT,
    "styleNo" TEXT,
    "counts" TEXT NOT NULL,
    "yarnType" TEXT NOT NULL,
    "millName" TEXT,
    "color" TEXT,
    "qty" DOUBLE PRECISION NOT NULL,
    "uom" TEXT NOT NULL DEFAULT 'Kgs',
    "rate" DOUBLE PRECISION NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "yarn_purchase_order_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "yarn_purchases" (
    "id" TEXT NOT NULL,
    "grnNo" TEXT NOT NULL,
    "grnDate" TIMESTAMP(3) NOT NULL,
    "partyId" TEXT NOT NULL,
    "storeId" TEXT,
    "poId" TEXT,
    "invoiceNo" TEXT,
    "invoiceDate" TIMESTAMP(3),
    "narration" TEXT,
    "vehicleNo" TEXT,
    "totalQty" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "gstAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "otherCharges" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "netAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "yarn_purchases_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "yarn_purchase_items" (
    "id" TEXT NOT NULL,
    "purchaseId" TEXT NOT NULL,
    "slNo" INTEGER NOT NULL,
    "lotNo" TEXT,
    "styleNo" TEXT,
    "counts" TEXT NOT NULL,
    "yarnType" TEXT NOT NULL,
    "millName" TEXT,
    "color" TEXT,
    "noOfBags" INTEGER NOT NULL DEFAULT 0,
    "qty" DOUBLE PRECISION NOT NULL,
    "uom" TEXT NOT NULL DEFAULT 'Kgs',
    "rate" DOUBLE PRECISION NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "yarn_purchase_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "yarn_process_outwards" (
    "id" TEXT NOT NULL,
    "dcNo" TEXT NOT NULL,
    "dcDate" TIMESTAMP(3) NOT NULL,
    "processType" TEXT NOT NULL,
    "storeId" TEXT,
    "partyId" TEXT NOT NULL,
    "targetDate" TIMESTAMP(3),
    "type" TEXT NOT NULL DEFAULT 'Fresh',
    "narration" TEXT,
    "vehicleNo" TEXT,
    "transport" TEXT,
    "ourTeam" TEXT,
    "totalQty" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalBags" INTEGER NOT NULL DEFAULT 0,
    "otherCharges" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "gstAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "roundOff" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "netAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'Open',
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "yarn_process_outwards_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "yarn_process_outward_items" (
    "id" TEXT NOT NULL,
    "outwardId" TEXT NOT NULL,
    "slNo" INTEGER NOT NULL,
    "lotNo" TEXT,
    "styleNo" TEXT,
    "counts" TEXT,
    "yarnType" TEXT,
    "millName" TEXT,
    "color" TEXT,
    "dyeColor" TEXT,
    "noOfBags" INTEGER NOT NULL DEFAULT 0,
    "stockQty" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "issueKgs" DOUBLE PRECISION NOT NULL,
    "uom" TEXT NOT NULL DEFAULT 'Kgs',
    "rate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "amount" DOUBLE PRECISION NOT NULL DEFAULT 0,

    CONSTRAINT "yarn_process_outward_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "yarn_process_inwards" (
    "id" TEXT NOT NULL,
    "dcNo" TEXT NOT NULL,
    "dcDate" TIMESTAMP(3) NOT NULL,
    "processType" TEXT NOT NULL,
    "storeId" TEXT,
    "partyId" TEXT NOT NULL,
    "outwardId" TEXT,
    "pdcNo" TEXT,
    "pdcDate" TIMESTAMP(3),
    "isPartReceipt" BOOLEAN NOT NULL DEFAULT false,
    "narration" TEXT,
    "vehicleNo" TEXT,
    "transport" TEXT,
    "totalQty" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "otherCharges" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "gstAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "roundOff" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "netAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "yarn_process_inwards_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "yarn_process_inward_items" (
    "id" TEXT NOT NULL,
    "inwardId" TEXT NOT NULL,
    "slNo" INTEGER NOT NULL,
    "outwardDcNo" TEXT,
    "lotNo" TEXT,
    "styleNo" TEXT,
    "counts" TEXT,
    "yarnType" TEXT,
    "issueColor" TEXT,
    "recColor" TEXT,
    "balQty" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "recQty" DOUBLE PRECISION NOT NULL,
    "uom" TEXT NOT NULL DEFAULT 'Kgs',
    "rate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "amount" DOUBLE PRECISION NOT NULL DEFAULT 0,

    CONSTRAINT "yarn_process_inward_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "yarn_sales" (
    "id" TEXT NOT NULL,
    "billNo" TEXT NOT NULL,
    "billDate" TIMESTAMP(3) NOT NULL,
    "billType" TEXT NOT NULL,
    "partyId" TEXT NOT NULL,
    "storeId" TEXT,
    "creditDays" INTEGER NOT NULL DEFAULT 0,
    "deliveryTo" TEXT,
    "hsnCode" TEXT,
    "narration" TEXT,
    "vehicleNo" TEXT,
    "transport" TEXT,
    "totalQty" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "freight" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "packing" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "gstAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "otherCharges" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "roundOff" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "netAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "yarn_sales_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "yarn_sale_items" (
    "id" TEXT NOT NULL,
    "saleId" TEXT NOT NULL,
    "slNo" INTEGER NOT NULL,
    "lotNo" TEXT,
    "styleNo" TEXT,
    "counts" TEXT,
    "yarnType" TEXT,
    "millName" TEXT,
    "color" TEXT,
    "noOfBags" INTEGER NOT NULL DEFAULT 0,
    "stockQty" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "weight" DOUBLE PRECISION NOT NULL,
    "uom" TEXT NOT NULL DEFAULT 'Kgs',
    "netRate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "rate" DOUBLE PRECISION NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "yarn_sale_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fabric_masters" (
    "id" TEXT NOT NULL,
    "clothDescription" TEXT NOT NULL,
    "dia" TEXT,
    "gsm" INTEGER,
    "content" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "fabric_masters_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fabric_stock" (
    "id" TEXT NOT NULL,
    "storeId" TEXT NOT NULL,
    "lotNo" TEXT NOT NULL,
    "styleNo" TEXT,
    "dia" TEXT,
    "clothDescription" TEXT,
    "content" TEXT,
    "color" TEXT,
    "dyeColor" TEXT,
    "printColor" TEXT,
    "gsm" INTEGER,
    "counts" TEXT,
    "weight" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "rolls" INTEGER NOT NULL DEFAULT 0,
    "uom" TEXT NOT NULL DEFAULT 'Kgs',
    "rate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "process" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "fabric_stock_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fabric_process_outwards" (
    "id" TEXT NOT NULL,
    "dcNo" TEXT NOT NULL,
    "dcDate" TIMESTAMP(3) NOT NULL,
    "processType" TEXT NOT NULL,
    "storeId" TEXT,
    "partyId" TEXT NOT NULL,
    "targetDate" TIMESTAMP(3),
    "type" TEXT NOT NULL DEFAULT 'Fresh',
    "narration" TEXT,
    "vehicleNo" TEXT,
    "transport" TEXT,
    "totalQty" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalRolls" INTEGER NOT NULL DEFAULT 0,
    "programQty" INTEGER NOT NULL DEFAULT 0,
    "otherCharges" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "roundOff" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "netAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'Open',
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "fabric_process_outwards_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fabric_process_outward_items" (
    "id" TEXT NOT NULL,
    "outwardId" TEXT NOT NULL,
    "slNo" INTEGER NOT NULL,
    "fromLotNo" TEXT,
    "fromStyle" TEXT,
    "lotNo" TEXT,
    "styleNo" TEXT,
    "dia" TEXT,
    "clothDescription" TEXT,
    "content" TEXT,
    "color" TEXT,
    "printColor" TEXT,
    "gsm" INTEGER,
    "counts" TEXT,
    "stockKgs" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "weight" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "rolls" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "fabric_process_outward_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fabric_process_outward_programs" (
    "id" TEXT NOT NULL,
    "outwardId" TEXT NOT NULL,
    "slNo" INTEGER NOT NULL,
    "lotNo" TEXT,
    "styleNo" TEXT,
    "styleRef" TEXT,
    "styleType" TEXT,
    "part" TEXT,
    "partGroup" TEXT,
    "noOfParts" INTEGER NOT NULL DEFAULT 0,
    "pcsWeight" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "color" TEXT,
    "size" TEXT,
    "qty" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "fabric_process_outward_programs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fabric_process_inwards" (
    "id" TEXT NOT NULL,
    "dcNo" TEXT NOT NULL,
    "dcDate" TIMESTAMP(3) NOT NULL,
    "processType" TEXT NOT NULL,
    "storeId" TEXT,
    "partyId" TEXT NOT NULL,
    "pdcNo" TEXT,
    "pdcDate" TIMESTAMP(3),
    "narration" TEXT,
    "vehicleNo" TEXT,
    "transport" TEXT,
    "totalQty" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalRolls" INTEGER NOT NULL DEFAULT 0,
    "otherCharges" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "gstAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "roundOff" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "netAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "fabric_process_inwards_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fabric_process_inward_items" (
    "id" TEXT NOT NULL,
    "inwardId" TEXT NOT NULL,
    "slNo" INTEGER NOT NULL,
    "lotNo" TEXT,
    "styleNo" TEXT,
    "dia" TEXT,
    "clothDescription" TEXT,
    "color" TEXT,
    "weight" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "rolls" INTEGER NOT NULL DEFAULT 0,
    "uom" TEXT NOT NULL DEFAULT 'Kgs',
    "rate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "amount" DOUBLE PRECISION NOT NULL DEFAULT 0,

    CONSTRAINT "fabric_process_inward_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "garment_styles" (
    "id" TEXT NOT NULL,
    "styleNo" TEXT NOT NULL,
    "styleReference" TEXT,
    "styleType" TEXT,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "garment_styles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "garment_parts" (
    "id" TEXT NOT NULL,
    "partName" TEXT NOT NULL,
    "partGroup" TEXT,

    CONSTRAINT "garment_parts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "garment_stock" (
    "id" TEXT NOT NULL,
    "storeId" TEXT NOT NULL,
    "lotNo" TEXT NOT NULL,
    "styleNo" TEXT,
    "styleRef" TEXT,
    "styleType" TEXT,
    "part" TEXT,
    "color" TEXT,
    "size" TEXT,
    "qty" INTEGER NOT NULL DEFAULT 0,
    "uom" TEXT NOT NULL DEFAULT 'Pcs',
    "rate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "process" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "garment_stock_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "garment_process_outwards" (
    "id" TEXT NOT NULL,
    "dcNo" TEXT NOT NULL,
    "dcDate" TIMESTAMP(3) NOT NULL,
    "processType" TEXT NOT NULL,
    "storeId" TEXT,
    "partyId" TEXT NOT NULL,
    "targetDate" TIMESTAMP(3),
    "remarks" TEXT,
    "vehicleNo" TEXT,
    "transport" TEXT,
    "totalQty" INTEGER NOT NULL DEFAULT 0,
    "totalAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'Open',
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "garment_process_outwards_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "garment_process_outward_items" (
    "id" TEXT NOT NULL,
    "outwardId" TEXT NOT NULL,
    "slNo" INTEGER NOT NULL,
    "bundleNo" TEXT,
    "lotNo" TEXT,
    "styleNo" TEXT,
    "styleRef" TEXT,
    "styleType" TEXT,
    "part" TEXT,
    "color" TEXT,
    "size" TEXT,
    "qty" INTEGER NOT NULL,
    "uom" TEXT NOT NULL DEFAULT 'Pcs',
    "rate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "amount" DOUBLE PRECISION NOT NULL DEFAULT 0,

    CONSTRAINT "garment_process_outward_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "garment_process_inwards" (
    "id" TEXT NOT NULL,
    "dcNo" TEXT NOT NULL,
    "dcDate" TIMESTAMP(3) NOT NULL,
    "processType" TEXT NOT NULL,
    "storeId" TEXT,
    "partyId" TEXT NOT NULL,
    "pdcNo" TEXT,
    "pdcDate" TIMESTAMP(3),
    "narration" TEXT,
    "vehicleNo" TEXT,
    "totalQty" INTEGER NOT NULL DEFAULT 0,
    "totalAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "garment_process_inwards_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "garment_process_inward_items" (
    "id" TEXT NOT NULL,
    "inwardId" TEXT NOT NULL,
    "slNo" INTEGER NOT NULL,
    "bundleNo" TEXT,
    "lotNo" TEXT,
    "styleNo" TEXT,
    "styleRef" TEXT,
    "part" TEXT,
    "color" TEXT,
    "size" TEXT,
    "goodQty" INTEGER NOT NULL DEFAULT 0,
    "defectQty" INTEGER NOT NULL DEFAULT 0,
    "uom" TEXT NOT NULL DEFAULT 'Pcs',

    CONSTRAINT "garment_process_inward_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "accessory_groups" (
    "id" TEXT NOT NULL,
    "groupName" TEXT NOT NULL,
    "hsnCode" TEXT,
    "gstPercent" DOUBLE PRECISION NOT NULL DEFAULT 0,

    CONSTRAINT "accessory_groups_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "accessory_masters" (
    "id" TEXT NOT NULL,
    "accessoryName" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "purchaseUom" TEXT,
    "stockUom" TEXT,
    "minimumStock" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "hsnCode" TEXT,
    "gstPercent" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "accessory_masters_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "accessory_stock" (
    "id" TEXT NOT NULL,
    "storeId" TEXT NOT NULL,
    "lotNo" TEXT NOT NULL,
    "styleNo" TEXT,
    "accessoryId" TEXT NOT NULL,
    "accColor" TEXT,
    "accSize" TEXT,
    "qty" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "weight" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "uom" TEXT NOT NULL,
    "rate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "accessory_stock_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "contractor_bills" (
    "id" TEXT NOT NULL,
    "billNo" TEXT NOT NULL,
    "billDate" TIMESTAMP(3) NOT NULL,
    "partyId" TEXT NOT NULL,
    "processType" TEXT,
    "narration" TEXT,
    "totalAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "gstAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "netAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'Pending',
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "contractor_bills_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "contractor_payments" (
    "id" TEXT NOT NULL,
    "paymentNo" TEXT NOT NULL,
    "paymentDate" TIMESTAMP(3) NOT NULL,
    "partyId" TEXT NOT NULL,
    "billId" TEXT,
    "amount" DOUBLE PRECISION NOT NULL,
    "paymentMode" TEXT,
    "referenceNo" TEXT,
    "narration" TEXT,
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "contractor_payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "metadata" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "companies_companyName_key" ON "companies"("companyName");

-- CreateIndex
CREATE UNIQUE INDEX "financial_years_yearCode_key" ON "financial_years"("yearCode");

-- CreateIndex
CREATE UNIQUE INDEX "parties_partyCode_key" ON "parties"("partyCode");

-- CreateIndex
CREATE UNIQUE INDEX "stores_storeName_key" ON "stores"("storeName");

-- CreateIndex
CREATE UNIQUE INDEX "processes_processName_key" ON "processes"("processName");

-- CreateIndex
CREATE UNIQUE INDEX "uoms_uomCode_key" ON "uoms"("uomCode");

-- CreateIndex
CREATE UNIQUE INDEX "colors_colorCode_key" ON "colors"("colorCode");

-- CreateIndex
CREATE UNIQUE INDEX "colors_colorName_key" ON "colors"("colorName");

-- CreateIndex
CREATE UNIQUE INDEX "concerns_concernName_key" ON "concerns"("concernName");

-- CreateIndex
CREATE UNIQUE INDEX "style_numbers_styleNo_key" ON "style_numbers"("styleNo");

-- CreateIndex
CREATE UNIQUE INDEX "gst_tax_slabs_taxName_key" ON "gst_tax_slabs"("taxName");

-- CreateIndex
CREATE UNIQUE INDEX "yarn_types_typeName_key" ON "yarn_types"("typeName");

-- CreateIndex
CREATE UNIQUE INDEX "yarn_counts_countName_key" ON "yarn_counts"("countName");

-- CreateIndex
CREATE UNIQUE INDEX "yarn_masters_yarnType_counts_millName_key" ON "yarn_masters"("yarnType", "counts", "millName");

-- CreateIndex
CREATE UNIQUE INDEX "yarn_purchase_orders_poNo_key" ON "yarn_purchase_orders"("poNo");

-- CreateIndex
CREATE UNIQUE INDEX "yarn_purchases_grnNo_key" ON "yarn_purchases"("grnNo");

-- CreateIndex
CREATE UNIQUE INDEX "yarn_process_outwards_dcNo_key" ON "yarn_process_outwards"("dcNo");

-- CreateIndex
CREATE UNIQUE INDEX "yarn_process_inwards_dcNo_key" ON "yarn_process_inwards"("dcNo");

-- CreateIndex
CREATE UNIQUE INDEX "yarn_sales_billNo_key" ON "yarn_sales"("billNo");

-- CreateIndex
CREATE UNIQUE INDEX "fabric_masters_clothDescription_dia_gsm_key" ON "fabric_masters"("clothDescription", "dia", "gsm");

-- CreateIndex
CREATE UNIQUE INDEX "fabric_process_outwards_dcNo_key" ON "fabric_process_outwards"("dcNo");

-- CreateIndex
CREATE UNIQUE INDEX "fabric_process_inwards_dcNo_key" ON "fabric_process_inwards"("dcNo");

-- CreateIndex
CREATE UNIQUE INDEX "garment_styles_styleNo_key" ON "garment_styles"("styleNo");

-- CreateIndex
CREATE UNIQUE INDEX "garment_parts_partName_key" ON "garment_parts"("partName");

-- CreateIndex
CREATE UNIQUE INDEX "garment_process_outwards_dcNo_key" ON "garment_process_outwards"("dcNo");

-- CreateIndex
CREATE UNIQUE INDEX "garment_process_inwards_dcNo_key" ON "garment_process_inwards"("dcNo");

-- CreateIndex
CREATE UNIQUE INDEX "accessory_groups_groupName_key" ON "accessory_groups"("groupName");

-- CreateIndex
CREATE UNIQUE INDEX "contractor_bills_billNo_key" ON "contractor_bills"("billNo");

-- CreateIndex
CREATE UNIQUE INDEX "contractor_payments_paymentNo_key" ON "contractor_payments"("paymentNo");

-- AddForeignKey
ALTER TABLE "yarn_purchase_orders" ADD CONSTRAINT "yarn_purchase_orders_partyId_fkey" FOREIGN KEY ("partyId") REFERENCES "parties"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "yarn_purchase_order_items" ADD CONSTRAINT "yarn_purchase_order_items_poId_fkey" FOREIGN KEY ("poId") REFERENCES "yarn_purchase_orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "yarn_purchases" ADD CONSTRAINT "yarn_purchases_partyId_fkey" FOREIGN KEY ("partyId") REFERENCES "parties"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "yarn_purchase_items" ADD CONSTRAINT "yarn_purchase_items_purchaseId_fkey" FOREIGN KEY ("purchaseId") REFERENCES "yarn_purchases"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "yarn_process_outwards" ADD CONSTRAINT "yarn_process_outwards_partyId_fkey" FOREIGN KEY ("partyId") REFERENCES "parties"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "yarn_process_outward_items" ADD CONSTRAINT "yarn_process_outward_items_outwardId_fkey" FOREIGN KEY ("outwardId") REFERENCES "yarn_process_outwards"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "yarn_process_inwards" ADD CONSTRAINT "yarn_process_inwards_partyId_fkey" FOREIGN KEY ("partyId") REFERENCES "parties"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "yarn_process_inwards" ADD CONSTRAINT "yarn_process_inwards_outwardId_fkey" FOREIGN KEY ("outwardId") REFERENCES "yarn_process_outwards"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "yarn_process_inward_items" ADD CONSTRAINT "yarn_process_inward_items_inwardId_fkey" FOREIGN KEY ("inwardId") REFERENCES "yarn_process_inwards"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "yarn_sales" ADD CONSTRAINT "yarn_sales_partyId_fkey" FOREIGN KEY ("partyId") REFERENCES "parties"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "yarn_sale_items" ADD CONSTRAINT "yarn_sale_items_saleId_fkey" FOREIGN KEY ("saleId") REFERENCES "yarn_sales"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fabric_process_outwards" ADD CONSTRAINT "fabric_process_outwards_partyId_fkey" FOREIGN KEY ("partyId") REFERENCES "parties"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fabric_process_outward_items" ADD CONSTRAINT "fabric_process_outward_items_outwardId_fkey" FOREIGN KEY ("outwardId") REFERENCES "fabric_process_outwards"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fabric_process_outward_programs" ADD CONSTRAINT "fabric_process_outward_programs_outwardId_fkey" FOREIGN KEY ("outwardId") REFERENCES "fabric_process_outwards"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fabric_process_inwards" ADD CONSTRAINT "fabric_process_inwards_partyId_fkey" FOREIGN KEY ("partyId") REFERENCES "parties"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fabric_process_inward_items" ADD CONSTRAINT "fabric_process_inward_items_inwardId_fkey" FOREIGN KEY ("inwardId") REFERENCES "fabric_process_inwards"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "garment_process_outwards" ADD CONSTRAINT "garment_process_outwards_partyId_fkey" FOREIGN KEY ("partyId") REFERENCES "parties"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "garment_process_outward_items" ADD CONSTRAINT "garment_process_outward_items_outwardId_fkey" FOREIGN KEY ("outwardId") REFERENCES "garment_process_outwards"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "garment_process_inwards" ADD CONSTRAINT "garment_process_inwards_partyId_fkey" FOREIGN KEY ("partyId") REFERENCES "parties"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "garment_process_inward_items" ADD CONSTRAINT "garment_process_inward_items_inwardId_fkey" FOREIGN KEY ("inwardId") REFERENCES "garment_process_inwards"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "accessory_masters" ADD CONSTRAINT "accessory_masters_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "accessory_groups"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
