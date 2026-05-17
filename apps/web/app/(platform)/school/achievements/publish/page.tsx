"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { GlassCard } from "@/components/neo/glass-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const DOMAINS = [
  "人工智能", "新材料", "新能源", "智能制造", "生物医药",
  "电子信息", "现代农业", "航空航天", "节能环保", "数字经济",
];

const ACHIEVEMENT_TYPES = [
  "专利", "软件著作权", "学术论文", "技术原型", "算法模型", "工艺方法", "设备装置",
];

const IP_STATUSES = ["已授权", "申请中", "无专利", "软件著作权", "开源"];

const PATENT_TYPES = ["发明专利", "实用新型", "外观设计"];

const COOPERATION_MODES = ["技术转让", "许可生产", "作价入股", "联合开发"];

const BUDGET_RANGES = ["10万以下", "10-50万", "50-200万", "200万+"];

const TRL_OPTIONS = Array.from({ length: 9 }, (_, i) => ({
  value: i + 1,
  label: `TRL ${i + 1} — ${["基础原理观测","技术概念形成","概念验证实验","实验室验证","相关环境验证","相关环境演示","运行环境演示","系统完整验证","实际系统验证"][i]}`,
}));

interface FormData {
  // 基本信息
  title: string;
  abstract: string;
  achievementType: string;
  domain: string;
  keywords: string;
  applicationScenario: string;
  // 知识产权
  ipStatus: string;
  patentNumbers: string;
  patentType: string;
  publicationLink: string;
  // 技术参数
  trlLevel: string;
  maturityDesc: string;
  cooperationMode: string;
  budgetRange: string;
  requiredAbilities: string;
  // 联系方式
  teamName: string;
  institutionName: string;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
}

const INIT: FormData = {
  title: "", abstract: "", achievementType: ACHIEVEMENT_TYPES[0], domain: DOMAINS[0],
  keywords: "", applicationScenario: "",
  ipStatus: IP_STATUSES[0], patentNumbers: "", patentType: PATENT_TYPES[0], publicationLink: "",
  trlLevel: "6", maturityDesc: "", cooperationMode: COOPERATION_MODES[0], budgetRange: BUDGET_RANGES[2],
  requiredAbilities: "",
  teamName: "", institutionName: "", contactName: "", contactEmail: "", contactPhone: "",
};

export default function PublishAchievementPage() {
  const router = useRouter();
  const [form, setForm] = useState<FormData>(INIT);
  const [submitting, setSubmitting] = useState(false);
  const [hint, setHint] = useState<{ type: "success" | "error"; msg: string } | null>(null);

  const update = (field: keyof FormData) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
      setForm((f) => ({ ...f, [field]: e.target.value }));
      setHint(null);
    };

  const handleSubmit = async () => {
    if (!form.title.trim()) { setHint({ type: "error", msg: "请填写成果名称" }); return; }
    if (!form.abstract.trim()) { setHint({ type: "error", msg: "请填写成果摘要" }); return; }
    if (!form.institutionName.trim()) { setHint({ type: "error", msg: "请填写所属机构" }); return; }
    if (!form.contactName.trim() || !form.contactEmail.trim()) {
      setHint({ type: "error", msg: "请填写完整联系方式" }); return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/v1/achievements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          creatorId: "school-user",
          creatorRole: "school",
          title: form.title,
          abstract: form.abstract,
          achievementType: form.achievementType,
          domain: form.domain,
          keywords: form.keywords.split(/[,，]/).map((s) => s.trim()).filter(Boolean),
          applicationScenario: form.applicationScenario || null,
          ipStatus: form.ipStatus,
          patentNumbers: form.patentNumbers.split(/[,，\n]/).map((s) => s.trim()).filter(Boolean),
          patentType: form.patentType || null,
          publicationLink: form.publicationLink || null,
          trlLevel: form.trlLevel ? parseInt(form.trlLevel) : null,
          maturityDesc: form.maturityDesc || null,
          cooperationMode: form.cooperationMode,
          budgetRange: form.budgetRange || null,
          requiredAbilities: form.requiredAbilities.split(/[,，]/).map((s) => s.trim()).filter(Boolean),
          teamName: form.teamName || null,
          institutionName: form.institutionName,
          contactName: form.contactName,
          contactEmail: form.contactEmail,
          contactPhone: form.contactPhone || null,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setHint({ type: "success", msg: `成果已发布（ID: ${data.achievement_id}）` });
        setTimeout(() => router.push("/transformation/achievements"), 1800);
      } else {
        setHint({ type: "error", msg: "发布失败，请重试" });
      }
    } catch {
      setHint({ type: "error", msg: "网络错误，请重试" });
    } finally {
      setSubmitting(false);
    }
  };

  const fieldCls = "flex flex-col gap-1.5";
  const labelCls = "font-quantum text-xs text-white/50";
  const selectCls = "flex h-10 w-full cursor-pointer rounded-[12px] border border-white/10 bg-white/5 px-4 py-2 font-quantum text-sm text-white/80 backdrop-blur-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/30";
  const textareaCls = "w-full resize-none rounded-[12px] border border-white/10 bg-white/5 px-4 py-3 font-quantum text-sm text-white/80 placeholder:text-white/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/30";
  const sectionTitle = "border-b border-white/5 pb-2 font-qdisplay text-base font-semibold text-cyan-200/80";

  return (
    <div className="space-y-5">
      {/* Breadcrumb + header */}
      <div>
        <div className="flex items-center gap-2 font-quantum text-xs text-white/35">
          <a href="/school/dashboard" className="hover:text-white/60">学校中心</a>
          <span>/</span>
          <span className="text-white/60">发布可转化成果</span>
        </div>
        <h1 className="mt-3 font-qdisplay text-3xl font-bold text-white/90">发布可转化成果</h1>
        <p className="mt-1 font-quantum text-sm text-white/45">
          填写成果详细信息，发布到成果库供企业浏览与对接
        </p>
      </div>

      <GlassCard className="p-6">
        <div className="space-y-8">

          {/* ── 基本信息 ── */}
          <div className="space-y-5">
            <h2 className={sectionTitle}>基本信息</h2>
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              <div className={`${fieldCls} md:col-span-2`}>
                <label className={labelCls}>成果名称 *</label>
                <Input value={form.title} onChange={update("title")} placeholder="如：高效钙钛矿太阳能电池低成本制备技术" />
              </div>
              <div className={fieldCls}>
                <label className={labelCls}>成果类型 *</label>
                <select value={form.achievementType} onChange={update("achievementType")} className={selectCls}>
                  {ACHIEVEMENT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div className={fieldCls}>
                <label className={labelCls}>技术领域 *</label>
                <select value={form.domain} onChange={update("domain")} className={selectCls}>
                  {DOMAINS.map((d) => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
              <div className={`${fieldCls} md:col-span-2`}>
                <label className={labelCls}>成果摘要 *</label>
                <textarea
                  value={form.abstract} onChange={update("abstract")}
                  placeholder="详细描述技术原理、创新点、核心指标、已有成果（专利/论文）等..."
                  className={`${textareaCls} min-h-[140px]`}
                />
              </div>
              <div className={fieldCls}>
                <label className={labelCls}>关键词（逗号分隔）</label>
                <Input value={form.keywords} onChange={update("keywords")} placeholder="如：钙钛矿，太阳能电池，印刷工艺" />
              </div>
              <div className={fieldCls}>
                <label className={labelCls}>应用场景</label>
                <Input value={form.applicationScenario} onChange={update("applicationScenario")} placeholder="如：分布式光伏、建筑一体化光伏" />
              </div>
            </div>
          </div>

          {/* ── 知识产权 ── */}
          <div className="space-y-5">
            <h2 className={sectionTitle}>知识产权</h2>
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              <div className={fieldCls}>
                <label className={labelCls}>知识产权状态 *</label>
                <select value={form.ipStatus} onChange={update("ipStatus")} className={selectCls}>
                  {IP_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div className={fieldCls}>
                <label className={labelCls}>专利类型</label>
                <select value={form.patentType} onChange={update("patentType")} className={selectCls}>
                  <option value="">不适用</option>
                  {PATENT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div className={`${fieldCls} md:col-span-2`}>
                <label className={labelCls}>专利号（多个用逗号或换行分隔）</label>
                <textarea
                  value={form.patentNumbers} onChange={update("patentNumbers")}
                  placeholder="如：CN202310001234.5, CN202310005678.9"
                  className={`${textareaCls} min-h-[72px]`}
                />
              </div>
              <div className={`${fieldCls} md:col-span-2`}>
                <label className={labelCls}>论文/成果链接</label>
                <Input type="url" value={form.publicationLink} onChange={update("publicationLink")} placeholder="https://doi.org/..." />
              </div>
            </div>
          </div>

          {/* ── 技术参数 ── */}
          <div className="space-y-5">
            <h2 className={sectionTitle}>技术参数与转化条件</h2>
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              <div className={fieldCls}>
                <label className={labelCls}>技术成熟度（TRL）</label>
                <select value={form.trlLevel} onChange={update("trlLevel")} className={selectCls}>
                  <option value="">未填写</option>
                  {TRL_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>
              <div className={fieldCls}>
                <label className={labelCls}>期望合作模式 *</label>
                <select value={form.cooperationMode} onChange={update("cooperationMode")} className={selectCls}>
                  {COOPERATION_MODES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div className={`${fieldCls} md:col-span-2`}>
                <label className={labelCls}>成熟度补充说明</label>
                <Input value={form.maturityDesc} onChange={update("maturityDesc")} placeholder="如：已完成工程样机验证，中试线建设中" />
              </div>
              <div className={fieldCls}>
                <label className={labelCls}>预算区间</label>
                <select value={form.budgetRange} onChange={update("budgetRange")} className={selectCls}>
                  <option value="">面议</option>
                  {BUDGET_RANGES.map((b) => <option key={b} value={b}>{b}</option>)}
                </select>
              </div>
              <div className={fieldCls}>
                <label className={labelCls}>所需能力标签（逗号分隔）</label>
                <Input value={form.requiredAbilities} onChange={update("requiredAbilities")} placeholder="如：材料科学，光电化学，工艺工程" />
                <p className="font-quantum text-xs text-white/30">与 TAI 能力维度对齐，用于智能匹配</p>
              </div>
            </div>
          </div>

          {/* ── 联系方式 ── */}
          <div className="space-y-5">
            <h2 className={sectionTitle}>团队与联系方式</h2>
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              <div className={fieldCls}>
                <label className={labelCls}>所属机构 *</label>
                <Input value={form.institutionName} onChange={update("institutionName")} placeholder="如：清华大学材料学院" />
              </div>
              <div className={fieldCls}>
                <label className={labelCls}>研究团队名称</label>
                <Input value={form.teamName} onChange={update("teamName")} placeholder="如：新能源材料与器件研究团队" />
              </div>
              <div className={fieldCls}>
                <label className={labelCls}>联系人姓名 *</label>
                <Input value={form.contactName} onChange={update("contactName")} placeholder="负责人姓名及职称" />
              </div>
              <div className={fieldCls}>
                <label className={labelCls}>联系邮箱 *</label>
                <Input type="email" value={form.contactEmail} onChange={update("contactEmail")} placeholder="name@university.edu.cn" />
              </div>
              <div className={fieldCls}>
                <label className={labelCls}>联系电话</label>
                <Input value={form.contactPhone} onChange={update("contactPhone")} placeholder="选填" />
              </div>
            </div>
          </div>
        </div>

        {/* Hint */}
        {hint && (
          <div className={`mt-6 rounded-[12px] border p-3 font-quantum text-sm ${
            hint.type === "success"
              ? "border-green-400/20 bg-green-500/10 text-green-200"
              : "border-red-400/20 bg-red-500/10 text-red-200"
          }`}>
            {hint.msg}
          </div>
        )}

        {/* Actions */}
        <div className="mt-6 flex justify-end gap-3 border-t border-white/5 pt-5">
          <Button variant="outline" onClick={() => router.back()}>取消</Button>
          <Button onClick={() => void handleSubmit()} disabled={submitting}>
            {submitting ? "发布中..." : "发布成果"}
          </Button>
        </div>
      </GlassCard>
    </div>
  );
}
