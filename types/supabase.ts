export type Database = {
  public: {
    Tables: {
      pcb_quotes: {
        Row: {
          id: number;
          pcbType: string | null;
          layers: number | null;
          thickness: string | null;
          hdi: string | null;
          tg: string | null;
          panelCount: number | null;
          shipmentType: string | null;
          singleLength: number | null;
          singleWidth: number | null;
          singleCount: number | null;
          border: string | null;
          surfaceFinish: string | null;
          copperWeight: string | null;
          minTrace: string | null;
          minHole: string | null;
          solderMask: string | null;
          silkscreen: string | null;
          goldFingers: string | null;
          castellated: string | null;
          impedance: string | null;
          flyingProbe: string | null;
          quantity: number | null;
          delivery: string | null;
          gerber: string | null;
          maskCover: string | null;
          edgePlating: string | null;
          halfHole: string | null;
          edgeCover: string | null;
          testMethod: string | null;
          prodCap: string | null;
          productReport: any | null;
          rejectBoard: string | null;
          yyPin: string | null;
          customerCode: string | null;
          payMethod: string | null;
          qualityAttach: string | null;
          smt: string | null;
          created_at: string | null;
        };
      };
      orders: {
        Row: {
          id: number;
          user_id: string | null;
          address_id: number | null;
          customs_id: number | null;
          pcb_spec: any;
          gerber_file_url: string | null;
          courier: string | null;
          price: number | null;
          shipping_cost: number | null;
          customs_fee: number | null;
          total: number | null;
          pcb_price: number | null;
          production_cycle: number | null;
          estimated_finish_date: string | null;
          pcb_note: string | null;
          user_note: string | null;
          status: string | null;
          admin_price: number | null;
          admin_note: string | null;
          created_at: string | null;
        };
      };
      addresses: {
        Row: {
          id: number;
          user_id: string | null;
          country: string;
          state: string | null;
          city: string | null;
          zip: string | null;
          address: string;
          phone: string | null;
          email: string | null;
          note: string | null;
          created_at: string | null;
        };
      };
      customs_declarations: {
        Row: {
          id: number;
          user_id: string | null;
          declaration_method: string;
          company_name: string | null;
          tax_id: string | null;
          personal_id: string | null;
          incoterm: string | null;
          purpose: string | null;
          declared_value: number | null;
          customs_note: string | null;
          created_at: string | null;
        };
      };
    };
  };
}; 