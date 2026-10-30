import { NextResponse } from "next/server";
import crypto from "crypto";
import { createClient } from "@supabase/supabase-js";
import Razorpay from "razorpay";

const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL;

const supabaseSecretKey =
  process.env.SUPABASE_SECRET_KEY;

if (!supabaseUrl || !supabaseSecretKey) {
  throw new Error(
    "Supabase server environment variables are missing."
  );
}

const supabaseAdmin = createClient(
  supabaseUrl,
  supabaseSecretKey
);

export async function POST(request: Request) {
  try {
    /*
     * ----------------------------------------------------
     * 1. CHECK RAZORPAY SECRET
     * ----------------------------------------------------
     */

    const keyId =
      process.env.RAZORPAY_KEY_ID;

    const keySecret =
      process.env.RAZORPAY_KEY_SECRET;

    if (!keyId || !keySecret) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Razorpay environment variables are missing.",
        },
        { status: 500 }
      );
    }

    /*
     * ----------------------------------------------------
     * 2. READ PAYMENT DATA
     * ----------------------------------------------------
     */

    const body = await request.json();

    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
    } = body;

    if (
      !razorpay_order_id ||
      !razorpay_payment_id ||
      !razorpay_signature
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Missing Razorpay payment details.",
        },
        { status: 400 }
      );
    }

    /*
     * ----------------------------------------------------
     * 3. VERIFY RAZORPAY SIGNATURE
     * ----------------------------------------------------
     */

    const generatedSignature =
      crypto
        .createHmac(
          "sha256",
          keySecret
        )
        .update(
          `${razorpay_order_id}|${razorpay_payment_id}`
        )
        .digest("hex");

    const isValid =
      generatedSignature ===
      razorpay_signature;

    if (!isValid) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Payment signature verification failed.",
        },
        { status: 400 }
      );
    }

    /*
     * ----------------------------------------------------
     * 4. CHECK STORE ORDER ID
     * ----------------------------------------------------
     */

    const storeOrderId =
      typeof body.storeOrderId === "string"
        ? body.storeOrderId
            .trim()
            .replace(/^#/, "")
        : "";

    /*
     * ----------------------------------------------------
     * 5. STORE ORDER
     * ----------------------------------------------------
     */

    if (storeOrderId) {
      /*
       * Find the store order.
       */

      const {
        data: storeOrder,
        error: storeOrderError,
      } =
        await supabaseAdmin
          .from("store_orders")
          .select(
            `
            id,
            total_amount,
            payment_status,
            status
            `
          )
          .eq("id", storeOrderId)
          .maybeSingle();

      if (storeOrderError) {
        console.error(
          "Store order lookup error:",
          storeOrderError
        );

        return NextResponse.json(
          {
            success: false,
            error:
              "Unable to find the store order.",
          },
          { status: 500 }
        );
      }

      if (!storeOrder) {
        return NextResponse.json(
          {
            success: false,
            error:
              "Store order not found.",
          },
          { status: 404 }
        );
      }

      /*
       * --------------------------------------------------
       * 6. CONNECT RAZORPAY ORDER TO STORE ORDER
       * --------------------------------------------------
       *
       * We retrieve the Razorpay order from Razorpay's
       * server API and check its receipt/notes.
       */

      const razorpay =
        new Razorpay({
          key_id: keyId,
          key_secret: keySecret,
        });

      let razorpayOrder: any;

      try {
        razorpayOrder =
          await razorpay.orders.fetch(
            razorpay_order_id
          );
      } catch (error) {
        console.error(
          "Razorpay order lookup error:",
          error
        );

        return NextResponse.json(
          {
            success: false,
            error:
              "Unable to verify the Razorpay order.",
          },
          { status: 400 }
        );
      }

      /*
       * --------------------------------------------------
       * 7. CHECK RECEIPT
       * --------------------------------------------------
       */

      const expectedReceipt =
        `STORE-${storeOrder.id}`;

      if (
        razorpayOrder.receipt !==
        expectedReceipt
      ) {
        console.error(
          "Razorpay receipt mismatch:",
          {
            expectedReceipt,
            actualReceipt:
              razorpayOrder.receipt,
          }
        );

        return NextResponse.json(
          {
            success: false,
            error:
              "Razorpay order does not belong to this store order.",
          },
          { status: 400 }
        );
      }

      /*
       * --------------------------------------------------
       * 8. CHECK RAZORPAY NOTES
       * --------------------------------------------------
       */

      const razorpayStoreOrderId =
        razorpayOrder?.notes
          ?.store_order_id;

      const razorpayOrderType =
        razorpayOrder?.notes
          ?.order_type;

      if (
        razorpayStoreOrderId !==
          storeOrder.id ||
        razorpayOrderType !==
          "STORE"
      ) {
        console.error(
          "Razorpay notes mismatch:",
          {
            expectedOrderId:
              storeOrder.id,
            actualOrderId:
              razorpayStoreOrderId,
            actualOrderType:
              razorpayOrderType,
          }
        );

        return NextResponse.json(
          {
            success: false,
            error:
              "Razorpay payment is not connected to this store order.",
          },
          { status: 400 }
        );
      }

      /*
       * --------------------------------------------------
       * 9. CHECK PAYMENT AMOUNT
       * --------------------------------------------------
       */

      const databaseAmount =
        Math.round(
          Number(
            storeOrder.total_amount
          ) * 100
        );

      const razorpayAmount =
        Number(
          razorpayOrder.amount
        );

      if (
        !Number.isFinite(
          databaseAmount
        ) ||
        databaseAmount <= 0
      ) {
        return NextResponse.json(
          {
            success: false,
            error:
              "Invalid store order amount.",
          },
          { status: 400 }
        );
      }

      if (
        razorpayAmount !==
        databaseAmount
      ) {
        console.error(
          "Payment amount mismatch:",
          {
            databaseAmount,
            razorpayAmount,
          }
        );

        return NextResponse.json(
          {
            success: false,
            error:
              "Payment amount does not match the store order.",
          },
          { status: 400 }
        );
      }

      /*
       * --------------------------------------------------
       * 10. PREVENT DUPLICATE PAYMENT PROCESSING
       * --------------------------------------------------
       */

      if (
        String(
          storeOrder.payment_status ||
            ""
        ).toLowerCase() === "paid"
      ) {
        return NextResponse.json({
          success: true,
          message:
            "Payment was already verified.",
          alreadyProcessed: true,
          orderType: "STORE",
          orderId:
            storeOrder.id,
        });
      }

      /*
       * --------------------------------------------------
       * 11. ATOMIC STOCK + PAYMENT PROCESSING
       * --------------------------------------------------
       *
       * The PostgreSQL function:
       *
       * - locks the order
       * - checks stock
       * - decreases stock
       * - marks payment Paid
       * - rolls everything back if anything fails
       */

      const {
        data: processResult,
        error: processError,
      } =
        await supabaseAdmin.rpc(
          "process_store_payment",
          {
            p_order_id:
              storeOrder.id,
          }
        );

      if (processError) {
        console.error(
          "Store payment processing error:",
          processError
        );

        return NextResponse.json(
          {
            success: false,
            error:
              processError.message ||
              "Unable to process store payment.",
          },
          { status: 400 }
        );
      }

      /*
       * --------------------------------------------------
       * 12. CHECK RPC RESULT
       * --------------------------------------------------
       */

      if (
        !processResult ||
        processResult.success !==
          true
      ) {
        return NextResponse.json(
          {
            success: false,
            error:
              processResult?.error ||
              "Store payment could not be processed.",
          },
          { status: 400 }
        );
      }

      /*
       * --------------------------------------------------
       * 13. ALREADY PROCESSED
       * --------------------------------------------------
       */

      if (
        processResult.already_processed ===
        true
      ) {
        return NextResponse.json({
          success: true,
          message:
            "Payment was already verified.",
          alreadyProcessed: true,
          orderType: "STORE",
          orderId:
            storeOrder.id,
        });
      }

      /*
       * --------------------------------------------------
       * 14. SUCCESS
       * --------------------------------------------------
       */

      return NextResponse.json({
        success: true,
        message:
          "Payment verified successfully and stock updated.",
        orderType: "STORE",
        orderId:
          storeOrder.id,
      });
    }

    /*
     * ----------------------------------------------------
     * 15. PVC PAYMENT
     * ----------------------------------------------------
     *
     * PVC remains separate.
     * No store stock processing is performed.
     */

    return NextResponse.json({
      success: true,
      message:
        "Payment verified successfully.",
      orderType: "PVC",
    });
  } catch (error) {
    console.error(
      "Razorpay verification error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Payment verification failed.",
      },
      { status: 500 }
    );
  }
}