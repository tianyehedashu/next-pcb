import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

const checklistItems = [
    { id: "panelization", label: "合拼: 连板出货时，合拼款数超限额。" },
    { id: "testing", label: "测试: 测试点数超常规范围，需根据资料计算测试费。" },
    { id: "gold-plating", label: "金费: 沉金面积超常规，需加收超金费。" },
    { id: "hole-copper", label: "孔铜: 要求大于25um，需加价。" },
    { id: "layers", label: "层数: 多层板涉及非常规层压结构。" },
    { id: "material", label: "板材: 板材利用率偏低，或客户指定生益以外的板材。" },
    { id: "board-type", label: "板类型: 软硬结合(FR4+PI)板制作需求。" },
    { id: "aperture-drilling", label: "孔径/钻孔: 孔径比超常规，或钻孔密度大于10万/㎡。" },
    { id: "special-holes", label: "特殊孔: 盘中孔、沉头孔要求。" },
    { id: "bga", label: "BGA: BGA焊盘小于0.25mm。" },
    { id: "gold-fingers", label: "金手指: 板子有金手指要求。" },
    { id: "board-shape", label: "板形: 外形复杂，或板内锣槽多/尺寸小。" },
    { id: "dimensions", label: "尺寸: 单片尺寸小于1cm x 1cm。" },
    { id: "quality-standard", label: "质量等级: 检查IPC或其它质量等级要求。" },
    { id: "shipping-fee", label: "运费检查: 核实计算的运费是否准确。" },
    { id: "gerber-notes", label: "Gerber备注: 检查Gerber文件中是否有特殊备注或说明。" },
    { id: "delivery", label: "交期检查: 检查交期是否符合要求,是否需要加急费，设置合理的到期日" },
];

export function AdminReviewChecklist() {
  return (
    <Card className="bg-yellow-50 border-yellow-200">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-yellow-900">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg>
          管理员审核清单
        </CardTitle>
        <CardDescription className="text-yellow-800">
            在确认价格和处理订单前，请逐项核对以下关键点。
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {checklistItems.map((item, index) => (
            <div key={item.id} className="flex items-start gap-3">
               <Checkbox id={item.id} className="mt-1 border-yellow-400 data-[state=checked]:bg-yellow-500"/>
               <Label htmlFor={item.id} className="text-sm text-gray-800">
                <strong className="font-semibold">{index + 1}. {item.label.split(':')[0]}:</strong>
                {item.label.substring(item.label.indexOf(':') + 1)}
               </Label>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
} 