
## 📖 摘要

**SkillTool** 是 Claude Code 中的核心执行工具，用于调用和管理**技能（Skills）**。它支持三种执行模式（内联、分叉、远程），具备精细化权限控制、灵活的上下文修改和完善的遥测系统。

---

## 🎯 核心概念

### 什么是 Skill？

一个 **Skill** 是一个封装的、可复用的工作流程单元，可以是：

| 类型 | 说明 | 示例 |
|------|------|------|
| **Local Prompt** | 本地 Markdown 格式的提示词 | `.claude/skills/review.md` |
| **Bundled Skill** | 捆绑在项目中的内置技能 | `commit`, `review-pr` |
| **MCP Skill** | 通过 MCP 协议的远程技能 | MCP 服务器提供的命令 |
| **Plugins** | 来自官方市场的插件技能 | 官方 Marketplace 的技能 |

### 技能的两个主要特性

```typescript
// 1. 参数化 - 使用占位符
---
name: review
args: filePath
---
You are a reviewer. Check: $FILEPATH

// 2. 模式选择 - 执行环境
context: inline  // 默认：在主 Agent 中执行
context: fork    // 可选：在子 Agent 中执行
```

---

## 🏗️ 执行架构

### 完整生命周期

```
┌─────────────────────────────────────────────────────────┐
│ 1. Input                                                │
│    { skill: "review", args: "src/main.ts" }           │
└────────────────────┬────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────┐
│ 2. Validation                                           │
│    ✓ 技能名称格式正确                                   │
│    ✓ 技能存在                                           │
│    ✓ 类型为 prompt                                      │
│    ✓ 无 disableModelInvocation 标记                    │
└────────────────────┬────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────┐
│ 3. Permission Check                                    │
│    ① 检查 deny 规则                                    │
│    ② 检查 allow 规则                                   │
│    ③ 检查安全属性                                      │
│    ④ 询问用户（默认）                                 │
└────────────────────┬────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────┐
│ 4. Execution Mode Decision                             │
│    ├─ fork: true  → 分叉执行                          │
│    ├─ remote      → 远程执行（experimental）          │
│    └─ 默认        → 内联执行                          │
└────────────────────┬────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────┐
│ 5. Result & Context Modification                       │
│    ├─ 返回执行结果                                     │
│    ├─ 修改工具权限                                     │
│    ├─ 覆盖模型配置                                     │
│    └─ 调整努力级别                                     │
└─────────────────────────────────────────────────────────┘
```

---

## 🔄 三种执行模式详解

### 1️⃣ 内联执行（Inline）- 轻量级

**特征**：直接在主 Agent 中展开技能内容

```typescript
// 执行步骤
processedCommand = processPromptSlashCommand(
  commandName,
  args,
  commands,
  context
)

// 处理效果
- 替换 $FILEPATH 等占位符 → src/main.ts
- 替换 !command 命令引用
- 返回展开后的完整 Prompt

// 返回结果
{
  success: true,
  commandName: "review",
  allowedTools: ["browser"],
  model: undefined,
  status: "inline"
}
```

**消息流**：
```
User: "请审查 src/main.ts"
  ↓
Assistant: [调用 SkillTool]  tool_use: SkillTool
  ↓
SkillTool Result: "Launching skill: review"
  ↓
User: [展开的技能内容]  "You are a code reviewer..."  ← 直接注入
  ↓
Assistant: [继续处理]  开始审查代码
```

**优势**：
- ⚡ 执行速度快（通常 < 1s）
- 💾 共享 token 预算
- 👀 结果立即可见
- 🔗 支持 follow-up 对话

**适用场景**：
```
/review file.ts              ✅ 快速代码审查
/check syntax               ✅ 语法检查
/explain concept            ✅ 概念解释
/format code                ✅ 代码格式化
```

---

### 2️⃣ 分叉执行（Forked）- 重量级

**特征**：在独立的子 Agent 中创建隔离的执行环境

```typescript
// 核心流程
const agentId = createAgentId()  // 创建独立 Agent ID
const agentDefinition = {
  ...baseAgent,
  effort: command.effort  // 继承技能配置
}

for await (const message of runAgent({
  agentDefinition,     // 子 Agent 配置
  promptMessages,      // 技能内容
  toolUseContext: {
    ...context,
    getAppState: modifiedGetAppState  // 独立环境
  },
  availableTools,      // 受限工具集
  override: { agentId }
})) {
  agentMessages.push(message)
  
  // 报告进度
  if (onProgress) {
    onProgress({
      toolUseID,
      data: {
        message,
        type: "skill_progress",
        agentId  // 让用户知道是哪个子 Agent
      }
    })
  }
}
```

**返回结果**：
```typescript
{
  success: true,
  commandName: "refactor",
  status: "forked",
  agentId: "agent_abc123xyz",
  result: "重构完成。共生成 3 个文件..."
}
```

**子 Agent 隔离环境**：
```
┌─────────────────────────────────────────┐
│ Sub-Agent (agent_abc123xyz)             │
│ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ │
│                                         │
│ 独立配置：                              │
│  • 独立 token 预算                     │
│  • 独立工具集                          │
│  • 独立消息历史                        │
│  • 独立的 effort 级别                  │
│                                         │
│ 执行流程：                              │
│  1️⃣ 分析输入                           │
│  2️⃣ 设计方案                           │
│  3️⃣ 执行工具调用                       │
│  4️⃣ 迭代优化                          │
│  5️⃣ 生成最终结果                       │
│                                         │
│ 消息处理：                              │
│  • 50+ 条中间消息                      │
│  • 40K+ token 消耗                     │
│  • 仅返回最终汇总                      │
│                                         │
└─────────────────────────────────────────┘
```

**优势**：
- 🔒 完全隔离的执行环境
- 📊 独立的 token 预算
- 🛠️ 支持多步骤复杂工作流
- 📝 不污染主 Agent 消息历史
- ⚙️ 可配置的 effort 级别

**适用场景**：
```
/refactor src/main.ts modernize    ✅ 复杂重构
/migrate database                  ✅ 迁移任务
/generate architecture             ✅ 架构设计
/audit security                    ✅ 安全审计
```

---

### 3️⃣ 远程执行（Remote）- 实验性

**特征**：从云存储（AKI/GCS）加载技能内容

> ⚠️ **仅限**：`USER_TYPE === 'ant'` + `EXPERIMENTAL_SKILL_SEARCH` 特性标志

```typescript
// 执行流程
if (feature('EXPERIMENTAL_SKILL_SEARCH') && process.env.USER_TYPE === 'ant') {
  const slug = stripCanonicalPrefix(commandName)  // _canonical_refactor
  const meta = getDiscoveredRemoteSkill(slug)
  
  const loadResult = await loadRemoteSkill(slug, meta.url)
  {
    cacheHit,        // 使用了本地缓存
    latencyMs,       // 加载耗时
    skillPath,       // 缓存路径
    content,         // SKILL.md 内容
    fileCount,       // 文件数量
    totalBytes       // 总字节数
  }
  
  // 处理内容
  const { content: bodyContent } = parseFrontmatter(content, skillPath)
  let finalContent = `Base directory: ${skillDir}\n\n${bodyContent}`
  finalContent = finalContent.replace(/\${CLAUDE_SKILL_DIR}/g, skillDir)
  
  // 注册以保持压实
  addInvokedSkill(commandName, skillPath, finalContent)
  
  // 直接注入
  return {
    data: { success: true, commandName, status: "inline" },
    newMessages: tagMessagesWithToolUseID([
      createUserMessage({ content: finalContent, isMeta: true })
    ], toolUseID)
  }
}
```

**特点**：
- 📡 从云加载（Marketplace 托管）
- 💾 本地缓存以提升性能
- 📦 支持多文件技能包
- 🔍 仅限发现的技能

---

## 🔐 权限系统

### 四层决策流程

权限检查采用**多层决策机制**，确保既安全又灵活：

```
权限检查入口
     ↓
┌────────────────────────────────┐
│ 第 1 层：Deny Rules (拒绝规则) │
│ ─────────────────────────────── │
│ 如果匹配 → 直接拒绝             │
│ 例：Skill(review:*): deny       │
└────────────────┬────────────────┘
                 │ 无匹配，继续
                 ↓
┌────────────────────────────────┐
│ 第 2 层：Allow Rules (允许规则) │
│ ─────────────────────────────── │
│ 如果匹配 → 直接允许             │
│ 例：Skill(review-pr): allow     │
└────────────────┬────────────────┘
                 │ 无匹配，继续
                 ↓
┌────────────────────────────────┐
│ 第 3 层：Safe Properties Check  │
│ ─────────────────────────────── │
│ 仅使用安全属性 → 自动允许       │
│ 例：基础提示词、模型覆盖         │
└────────────────┬────────────────┘
                 │ 有非安全属性，继续
                 ↓
┌────────────────────────────────┐
│ 第 4 层：User Prompt (用户确认) │
│ ─────────────────────────────── │
│ 询问用户，提供快速允许建议       │
│ 建议选项：                      │
│  • 精确匹配：review-pr           │
│  • 前缀匹配：review-pr:*         │
└────────────────────────────────┘
```

### 规则匹配语法

```typescript
// 精确匹配
"review-pr"       // 仅匹配 review-pr
"/review-pr"      // 支持前缀 /，会自动规范化

// 前缀匹配（冒号通配符）
"review:*"        // 匹配所有 review-* 开头的技能
"refactor:*"      // 匹配所有 refactor-* 开头的技能

// 规范化过程
const normalizedRule = rule.startsWith('/') 
  ? rule.substring(1) 
  : rule

// 匹配逻辑
if (normalizedRule.endsWith(':*')) {
  const prefix = normalizedRule.slice(0, -2)
  return commandName.startsWith(prefix)  // prefix 匹配
} else {
  return normalizedRule === commandName  // 精确匹配
}
```

### 安全属性列表

技能被认为是"安全的"当且仅当仅使用以下属性：

```typescript
SAFE_SKILL_PROPERTIES = {
  // PromptCommand 属性
  'type', 'progressMessage', 'contentLength', 'argNames',
  'model', 'effort', 'source', 'pluginInfo',
  'disableNonInteractive', 'skillRoot', 'context', 'agent',
  'getPromptForCommand', 'frontmatterKeys',
  
  // CommandBase 属性
  'name', 'description', 'hasUserSpecifiedDescription',
  'isEnabled', 'isHidden', 'aliases', 'isMcp', 'argumentHint',
  'whenToUse', 'paths', 'version', 'disableModelInvocation',
  'userInvocable', 'loadedFrom', 'immediate', 'userFacingName'
}
```

任何**未在此列表中的属性**且有**非平凡值**时，该技能需要权限检查。

---

## 📚 实际场景案例

### 场景 1：简单审查（Inline）

**技能定义**：`.claude/skills/review.md`
```markdown
---
name: review
args: filePath
---

You are a code reviewer.
Review the file: $FILEPATH

Provide:
1. Bug analysis
2. Performance issues
3. Suggestions
```

**执行过程**：
```
User Input: "/review src/main.ts"
     ↓
validateInput()
  ✓ 技能存在
  ✓ 类型为 prompt
  ✓ 无 fork 标记 → 预期 inline
     ↓
checkPermissions()
  → 仅使用安全属性 → 自动允许 ✓
     ↓
call() → inline 路径
  ① processPromptSlashCommand("review", "src/main.ts")
     - 替换 $FILEPATH → src/main.ts
     - 返回展开的提示词
     
  ② 返回结果：
     {
       success: true,
       commandName: "review",
       allowedTools: [],
       status: "inline"
     }
     
  ③ 新消息直接注入
     newMessages: [
       {
         type: "user",
         content: "You are a code reviewer.\nReview the file: src/main.ts\n...",
         toolUseID: "skill_<id>"
       }
     ]
     ↓
主 Agent 处理
  → Claude 在当前对话中执行审查
  → 可以使用浏览器或代码编辑工具
  → 审查结果立即生成
```

**消息流示意**：
```
对话历史
├─ User: "请审查 src/main.ts"
├─ Assistant: [tool_use] SkillTool(review, src/main.ts)
├─ tool_result: "Launching skill: review"
├─ User: "You are a code reviewer. Review: src/main.ts..." ← 展开的提示
└─ Assistant: [做出审查]
   "我发现以下问题..."
```

---

### 场景 2：复杂重构（Forked）

**技能定义**：`.claude/skills/refactor.md`
```markdown
---
name: refactor
args: filePath,refactoringType
context: fork
effort: high
---

You are a refactoring expert.
Refactor $FILEPATH using pattern: $REFACTORING_TYPE

Generate:
1. Refactored code
2. Migration guide
3. Test cases
4. Backward compatibility
```

**执行过程**：
```
User Input: "/refactor src/legacy.ts modernize"
     ↓
validateInput()
  ✓ 技能存在
  ✓ 类型为 prompt
  ✓ context: fork 标记 → 预期 forked ✓
     ↓
checkPermissions()
  → 可能需要用户确认
     ↓
executeForkedSkill()
  
  ① 创建子 Agent
     agentId = "agent_abc123xyz"
     agentDefinition = {
       agentType: "claude-3-5-sonnet",
       effort: "high"  ← 来自技能
     }
  
  ② 准备技能内容
     promptMessages = [
       {
         type: "user",
         content: "You are a refactoring expert.\nRefactor src/legacy.ts...",
         isMeta: true
       }
     ]
  
  ③ 运行子 Agent
     for await (message of runAgent({
       agentDefinition,
       promptMessages,
       toolUseContext: { ...context },
       availableTools: parent.tools,
       override: { agentId }
     })) {
       agentMessages.push(message)
       
       // 进度报告
       onProgress({
         type: "skill_progress",
         agentId: "agent_abc123xyz"
       })
     }
  
  ④ 子 Agent 独立工作
     ┌────────────────────────┐
     │ Sub-Agent 执行中...    │
     │ 消息 #1: 分析输入      │
     │ 消息 #2: 设计方案      │
     │ 消息 #3: tool_use     │
     │ 消息 #4: tool_result  │
     │ ...（约 50 条消息）     │
     │ 消息 #50: 完成        │
     │                       │
     │ token 消耗：40K       │
     │ 执行时间：5-10 秒     │
     └────────────────────────┘
  
  ⑤ 汇总结果
     resultText = "重构完成。共生成 3 个文件：
       - src/legacy.ts (重构版本)
       - MIGRATION.md (迁移指南)
       - test/refactor.test.ts (测试)"
     
     agentMessages.length = 0  // 清空，释放内存
  
  ⑥ 返回给主 Agent
     {
       success: true,
       commandName: "refactor",
       status: "forked",
       agentId: "agent_abc123xyz",
       result: resultText
     }
     ↓
主 Agent 处理结果
  → 可以看到重构完成的总结
  → token 预算保持完整
  → 可以继续下一个任务
```

**消息流示意**：
```
对话历史
├─ User: "请重构 src/legacy.ts"
├─ Assistant: [tool_use] SkillTool(refactor, ...)
│
│ 【创建 Sub-Agent: agent_abc123xyz】
│
│ ├─ Progress #1: "分析中..."
│ ├─ Progress #2: "生成重构方案..."
│ ├─ Progress #3: "执行代码修改..."
│ └─ Progress #4: "测试生成完成..."
│
├─ tool_result: "Skill 'refactor' completed (forked execution).
│               Result: 重构完成。共生成 3 个文件..."
│
└─ Assistant: "重构完成。新代码已生成..."
   ← 主 Agent 接收汇总结果
```

---

## 📊 Inline vs Forked 对比

### 维度对比表

| 维度 | Inline | Forked |
|------|--------|--------|
| **Sub-Agent** | ❌ 无 | ✅ 有独立 Sub-Agent |
| **Token 预算** | 共享主 Agent | 独立分配 |
| **消息展开** | 展开为单条消息 | 收集后汇总 |
| **执行速度** | 快（< 1s） | 慢（数秒到分钟） |
| **工具调用主体** | 主 Agent | Sub-Agent |
| **消息历史** | 在主对话中 | 隔离 |
| **中间结果** | 主 Agent 可见 | 隐藏 |
| **复杂度** | 低 | 高 |
| **CPU 消耗** | 低 | 高 |
| **适用任务** | 快速、轻量 | 复杂、多步 |

### 选择决策树

```
是否需要快速反馈？
  ├─ YES → Inline ✅
  │   "我需要立即得到结果"
  │   例：/check /review /format
  │
  └─ NO → 继续...
        是否是复杂的多步骤任务？
          ├─ YES → Forked ✅
          │   "我需要完整的工作流"
          │   例：/refactor /migrate /audit
          │
          └─ NO → Inline ✅
              "简单任务用 Inline"
```

---

## ⚡ 上下文修改链

技能可以通过 `contextModifier` 函数动态修改主 Agent 的执行上下文。这些修改会**链式组合**：

### 1. 工具权限修改

```typescript
// 技能可以限制可用工具
contextModifier(ctx) {
  return {
    ...ctx,
    getAppState() {
      const appState = ctx.getAppState()
      return {
        ...appState,
        toolPermissionContext: {
          ...appState.toolPermissionContext,
          alwaysAllowRules: {
            command: ["browser"]  // 仅允许 browser
          }
        }
      }
    }
  }
}
```

**效果**：后续工具调用受到限制

### 2. 模型覆盖

```typescript
contextModifier(ctx) {
  return {
    ...ctx,
    options: {
      ...ctx.options,
      mainLoopModel: resolveSkillModelOverride(
        model,  // 技能指定的模型
        ctx.options.mainLoopModel
      )
    }
  }
}
```

**效果**：后续使用不同的 LLM 模型

### 3. Effort 级别调整

```typescript
contextModifier(ctx) {
  const previousGetAppState = ctx.getAppState
  return {
    ...ctx,
    getAppState() {
      const appState = previousGetAppState()
      return {
        ...appState,
        effortValue: effort  // high / normal / low
      }
    }
  }
}
```

**效果**：调整计算步骤预算

### 修改器链式组合

```
技能 A 的 contextModifier
  ↓
修改工具权限
  ↓
技能 B 的 contextModifier
  ↓
修改模型
  ↓
技能 C 的 contextModifier
  ↓
修改 effort
  ↓
最终的组合上下文开始执行
```

---

## 📈 遥测与分析

### 核心事件：`tengu_skill_tool_invocation`

每次技能调用都会记录详细的事件数据：

```typescript
logEvent('tengu_skill_tool_invocation', {
  // 基础信息
  command_name: 'review',                    // 技能名（已规范化）
  _PROTO_skill_name: 'review',              // 技能名（原始）
  
  // 执行环境
  execution_context: 'inline' | 'forked' | 'remote',
  
  // 触发信息
  invocation_trigger: 'claude-proactive' | 'nested-skill',
  query_depth: 0,  // 嵌套深度
  
  // 技能来源
  skill_source: 'bundled' | 'plugin' | 'mcp' | 'local',
  skill_loaded_from: 'mcp' | undefined,
  skill_kind: 'prompt' | undefined,
  
  // 插件信息（如适用）
  _PROTO_plugin_name: 'official-review',
  _PROTO_marketplace_name: 'claude-marketplace',
  plugin_name: 'third-party' | '插件名',
  plugin_repository: 'repository-url',
  
  // 远程技能信息（仅 remote）
  was_discovered: true,
  is_remote: true,
  remote_cache_hit: true,
  remote_load_latency_ms: 245,
  
  // 调用链
  parent_agent_id: 'agent_parent_id'  // 父 Agent ID
})
```

### 其他事件

```typescript
// 远程技能加载事件
logRemoteSkillLoaded({
  slug: 'refactor-modernize',
  cacheHit: true,
  latencyMs: 245,
  urlScheme: 'gs',              // gs | http | https | s3
  fileCount: 3,
  totalBytes: 15240,
  fetchMethod: 'cache' | 'remote'
})

// 斜杠前缀检测
logEvent('tengu_skill_tool_slash_prefix', {})
```

---

## 🎨 设计特点

### 1. 惰性加载（Lazy Loading）

```typescript
export const inputSchema = lazySchema(() =>
  z.object({
    skill: z.string().describe(''),
    args: z.string().optional()
  })
)
```

**优势**：
- 延迟 Zod 序列化器初始化
- 减少启动时间
- 避免不必要的 schema 构建

### 2. 条件编译与树摇（Tree-shaking）

```typescript
const remoteSkillModules = feature('EXPERIMENTAL_SKILL_SEARCH')
  ? { /* 仅当功能启用时加载 */ }
  : null
```

**优势**：
- 实验性功能只在需要时加载
- 生产构建中完全移除未使用的代码
- 减少包体积

### 3. 权限隔离

```typescript
// 分叉执行中的子 Agent 获得受限的工具集
availableTools: context.options.tools
  // 可能被 contextModifier 进一步限制
```

**优势**：
- 防止不可信技能滥用工具
- 细粒度权限控制
- 安全沙箱隔离

### 4. 消息压实优化

```typescript
const toolUseID = getToolUseIDFromParentMessage(parentMessage)
const newMessages = tagMessagesWithToolUseID(messages, toolUseID)
```

**优势**：
- 技能消息标记为可转移状态
- 对话压实时自动保留重要内容
- 避免信息丢失

### 5. 嵌套追踪

```typescript
const queryDepth = context.queryTracking?.depth ?? 0
const parentAgentId = getAgentContext()?.agentId

logEvent('tengu_skill_tool_invocation', {
  query_depth: queryDepth,  // 0: 顶级, >0: 嵌套
  invocation_trigger: queryDepth > 0 ? 'nested-skill' : 'claude-proactive'
})
```

**优势**：
- 追踪嵌套技能调用链
- 防止无限递归
- 分析技能使用模式

---

## 🔄 消息处理流程

### Inline 消息流

```
原始命令行             /review src/main.ts

Normalizing            → review

Finding Command        → { type: 'prompt', ... }

Processing             → Replace $FILEPATH with src/main.ts

Tagging                → Add toolUseID marker

Filtering              → Remove progress messages, command-message

Final Messages:
  [
    {
      type: "user",
      content: "You are a code reviewer...",
      toolUseID: "skill_<id>",
      isMeta: true  // 可转移状态标记
    }
  ]

Status                 → These messages injected into conversation
```

### Forked 消息流

```
原始命令行             /refactor src/legacy.ts modernize

Sub-Agent Execution    → 在 agent_abc123xyz 中运行

Message Collection:
  Message #1: {type: assistant, content: ...}
  Message #2: {type: user, content: ...}
  Message #3: {type: assistant, content: [tool_use]}
  ...
  Message #50: {type: assistant, content: ...}

Result Extraction      → extractResultText(agentMessages)

Memory Cleanup         → agentMessages.length = 0

Return to Main Agent:
  {
    success: true,
    commandName: "refactor",
    status: "forked",
    agentId: "agent_abc123xyz",
    result: "重构完成..."
  }

Status                 → Single summary result returned
```

---

## 🛡️ 错误处理

### 验证错误代码

| 代码 | 含义 | 处理 |
|------|------|------|
| `1` | 无效的技能格式 | 检查是否为空或格式错误 |
| `2` | 未知的技能 | 技能不存在或名称拼写错误 |
| `4` | 禁用 Model 调用 | 该技能不支持通过工具调用 |
| `5` | 非 prompt 类型 | 该命令类型不支持（如 shell） |
| `6` | 远程技能未发现 | 需要先运行 DiscoverSkills |

### 权限拒绝

```typescript
// 当验证规则或权限检查失败时
{
  behavior: 'deny',
  message: 'Skill execution blocked by permission rules',
  decisionReason: {
    type: 'rule',
    rule: { /* 触发的规则 */ }
  }
}
```

### 执行异常

```typescript
try {
  for await (const message of runAgent(...)) {
    agentMessages.push(message)
  }
} finally {
  // 始终清理状态
  clearInvokedSkillsForAgent(agentId)
}
```

---

## 📋 最佳实践

### ✅ 何时使用 Inline

```
✓ 快速任务（< 5s 内完成）
✓ 不需要多步骤工作流
✓ 结果立即需要验证
✓ token 预算紧张

示例：/review /check /format /lint /explain
```

### ✅ 何时使用 Forked

```
✓ 复杂任务（需要深入分析）
✓ 多步骤工作流（规划→执行→验证）
✓ 高计算成本的操作
✓ 需要隔离的执行环境

示例：/refactor /migrate /audit /generate-docs
```

### ✅ 权限规则编写

```markdown
# 允许所有官方技能的精确调用
Skill(review): allow
Skill(commit): allow
Skill(generate): allow

# 允许用户技能的前缀模式
Skill(custom:*): allow

# 拒绝危险的系统级技能
Skill(rm:*): deny
Skill(sudo:*): deny
```

### ✅ 技能开发建议

```markdown
# 简单技能用 inline（默认）
【不指定 context，使用默认 inline】
result: 立即反馈 ✓

# 复杂任务用 forked
【在 frontmatter 指定 context: fork】
result: 独立处理 ✓

# 根据任务复杂度设置 effort
effort: low      # 快速任务
effort: normal   # 一般任务  ← 默认
effort: high     # 复杂任务
```

---

## 🎯 总结

**SkillTool** 通过以下设计实现了强大而灵活的技能执行系统：

| 特性 | 实现方式 |
|------|---------|
| **灵活的执行模式** | Inline / Forked / Remote |
| **精细化权限控制** | 4 层决策机制 + 规则引擎 |
| **资源隔离** | Sub-Agent 独立环境 |
| **性能优化** | 惰性加载、条件编译、缓存策略 |
| **可观测性** | 详细的事件遥测和追踪 |
| **用户体验** | 进度报告、权限建议、快速反馈 |

这个架构使 Claude Code 能够：
- 🚀 **快速执行**简单任务（Inline）
- 🔧 **独立处理**复杂工程问题（Forked）
- 🌐 **扩展能力**通过远程技能（Remote）
- 🔒 **安全运行**通过权限隔离和规则控制
- 📊 **完整追踪**整个执行过程

---

**文档版本**：v1.0  
**上次更新**：2026-04-07  
**涵盖范围**：SkillTool 完整实现分析
