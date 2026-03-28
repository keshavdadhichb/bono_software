import { requirePermission } from "@/lib/api-auth"
import { type NextRequest } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const authCheck = await requirePermission("canViewMaster"); if (authCheck) return authCheck;
    const slabs = await db.gstTaxSlab.findMany({
      orderBy: { taxName: "asc" },
    });
    return Response.json(slabs);
  } catch (error) {
    console.error("Failed to fetch GST slabs:", error);
    return Response.json(
      { error: "Failed to fetch GST slabs" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const authCheck = await requirePermission("canEditMaster"); if (authCheck) return authCheck;
    const body = await request.json();

    if (!body.taxName) {
      return Response.json(
        { error: "Tax Name is required" },
        { status: 400 }
      );
    }

    if (body.cgstRate === undefined || body.sgstRate === undefined) {
      return Response.json(
        { error: "CGST and SGST rates are required" },
        { status: 400 }
      );
    }

    const slab = await db.gstTaxSlab.create({
      data: {
        taxName: body.taxName,
        cgstRate: parseFloat(body.cgstRate),
        sgstRate: parseFloat(body.sgstRate),
        hsnCode: body.hsnCode || null,
      },
    });

    return Response.json(slab, { status: 201 });
  } catch (error) {
    console.error("Failed to create GST slab:", error);
    return Response.json(
      { error: "Failed to create GST slab" },
      { status: 500 }
    );
  }
}
