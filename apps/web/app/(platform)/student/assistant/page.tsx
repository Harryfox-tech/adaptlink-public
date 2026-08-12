"use client";

import Image from "next/image";
import { useChat } from "ai/react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { labelChatStatus } from "@/lib/ui-labels";

export default function StudentAssistantPage() {
  const { messages, input, handleInputChange, handleSubmit, status, error } = useChat({
    api: "/api/chat",
    initialInput: "请基于我的简历和目标岗位，给我 4 条可执行的提升建议。",
  });

  return (
    <div className="space-y-4">
      <section className="relative mb-6 space-y-3 border-b border-white/10 pb-10">
        <h1 className="text-4xl font-semibold tracking-tight text-white">AI 求职助手</h1>
        <p className="text-[14px] leading-[22px] text-white/65">
          对话式求职助手，支持简历优化、模拟问答和岗位匹配建议。
        </p>
        <div className="flex flex-wrap gap-2">
          <Badge>智能对话</Badge>
          <Badge>场景化问答</Badge>
          <Badge>行动建议</Badge>
        </div>
        <div className="pointer-events-none absolute -bottom-10 right-0 h-44 w-44 md:h-52 md:w-52">
          <Image src="/pic/hehe.png" alt="AI 助手" width={180} height={180} className="page-bg-blend h-full w-full object-contain" />
        </div>
      </section>

      <div className="grid gap-4 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>对话记录</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[420px] space-y-3 overflow-y-auto rounded-[16px] border border-white/10 bg-white/5 p-3">
              {messages.length === 0 ? (
                <p className="text-sm text-white/55">输入你的问题，助手会给出结构化建议。</p>
              ) : (
                messages.map((message) => (
                  <div key={message.id} className={message.role === "user" ? "text-right" : "text-left"}>
                    <div
                      className={
                        message.role === "user"
                          ? "ml-auto inline-block max-w-[90%] rounded-lg border border-cyan-300/20 bg-cyan-500/15 px-3 py-2 text-sm text-white"
                          : "inline-block max-w-[90%] rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/80"
                      }
                    >
                      {message.content}
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>发送问题</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-3">
              <Textarea
                name="prompt"
                value={input}
                onChange={handleInputChange}
                placeholder="例如：请帮我准备数据分析实习生一面的 10 个高频问题和回答框架。"
                className="min-h-[220px]"
              />
              <Button type="submit" disabled={status === "streaming" || !input.trim()}>
                {status === "streaming" ? "生成中..." : "发送给助手"}
              </Button>
              {error ? <p className="text-sm text-rose-300">请求失败：{error.message}</p> : null}
              <p className="text-xs text-white/55">当前状态：{labelChatStatus(status)}</p>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
