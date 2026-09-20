import { useCallback, useEffect, useMemo } from 'react'
import {
  Background,
  Controls,
  MiniMap,
  ReactFlow,
  ReactFlowProvider,
  useEdgesState,
  useNodesState,
  type Edge,
  type Node,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { useIntel } from '@/context/IntelContext'
import type { IntelRecord } from '@/types'

export function MiniGraph({ focusId }: { focusId?: string }) {
  const { records } = useIntel()
  const focus = records.find((r) => r.id === focusId) ?? records[0]
  const { nodes: initNodes, edges: initEdges } = useMemo(() => buildGraph(focus ? [focus, ...records.filter((r) => focus.relatedIds.includes(r.id))] : records.slice(0, 8)), [focus, records])
  const [nodes, , onNodesChange] = useNodesState(initNodes)
  const [edges, , onEdgesChange] = useEdgesState(initEdges)

  return (
    <div className="h-full w-full">
      <ReactFlowProvider>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        fitView
        colorMode="dark"
        proOptions={{ hideAttribution: true }}
      >
        <Background gap={22} color="rgba(126,232,255,0.08)" />
        <Controls />
      </ReactFlow>
      </ReactFlowProvider>
    </div>
  )
}

export function FullGraph({
  filter,
  onSelect,
}: {
  filter: string
  onSelect: (label: string, detail: string) => void
}) {
  const { records } = useIntel()
  const subset = useMemo(() => {
    const base = records.slice(0, 24)
    if (!filter || filter === 'all') return base
    return base.filter((r) => r.datasetId === filter || r.organization.toLowerCase().includes(filter.toLowerCase()))
  }, [filter, records])
  const built = useMemo(() => buildGraph(subset), [subset])
  const [nodes, setNodes, onNodesChange] = useNodesState(built.nodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState(built.edges)

  useEffect(() => {
    setNodes(built.nodes)
    setEdges(built.edges)
  }, [built, setEdges, setNodes])

  const onNodeClick = useCallback(
    (_: unknown, node: Node) => {
      onSelect(String(node.data.label), String(node.data.detail ?? node.id))
      setNodes((ns) => ns.map((n) => ({ ...n, selected: n.id === node.id })))
    },
    [onSelect, setNodes],
  )

  return (
    <div className="relative h-full w-full">
      <ReactFlowProvider>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={onNodeClick}
        fitView
        colorMode="dark"
        minZoom={0.3}
        maxZoom={1.8}
        proOptions={{ hideAttribution: true }}
      >
        <Background gap={24} color="rgba(126,232,255,0.08)" />
        <MiniMap maskColor="rgba(5,8,13,0.8)" />
        <Controls />
      </ReactFlow>
      </ReactFlowProvider>
      <button
        type="button"
        className="absolute right-3 top-3 z-10 rounded-lg border border-white/15 bg-[#071018] px-3 py-1 text-xs"
        onClick={() => {
          setNodes(built.nodes)
          setEdges(built.edges)
        }}
      >
        Reset graph
      </button>
    </div>
  )
}

function buildGraph(records: IntelRecord[]): { nodes: Node[]; edges: Edge[] } {
  const nodes: Node[] = []
  const edges: Edge[] = []
  const seen = new Set<string>()

  function add(id: string, label: string, x: number, y: number, color: string, detail: string) {
    if (seen.has(id)) return
    seen.add(id)
    nodes.push({
      id,
      position: { x, y },
      data: { label, detail },
      style: {
        background: '#0b1620',
        color: '#d7e4ee',
        border: `1px solid ${color}`,
        borderRadius: 12,
        padding: 8,
        fontSize: 11,
        boxShadow: `0 0 16px ${color}33`,
      },
    })
  }

  records.forEach((r, i) => {
    const col = i % 4
    const row = Math.floor(i / 4)
    add(`p-${r.id}`, r.name, 280 + col * 40, 80 + row * 90, '#7ee8ff', `Person · ${r.id}`)
    add(`u-${r.username}`, `@${r.username}`, 520, 40 + i * 28, '#4de1c1', 'Username')
    add(`o-${r.organization}`, r.organization, 40, 60 + (i % 8) * 70, '#e8c07a', 'Organization')
    add(`d-${r.datasetId}`, r.datasetId, 760, 50 + (i % 6) * 80, '#9bb0c0', 'Dataset')
    r.domains.forEach((dom, di) => add(`m-${dom}`, dom, 40, 420 + di * 50 + (i % 3) * 10, '#7ee8ff', 'Domain'))
    edges.push(
      { id: `e-p-u-${r.id}`, source: `p-${r.id}`, target: `u-${r.username}`, animated: true, style: { stroke: '#4de1c1' } },
      { id: `e-p-o-${r.id}`, source: `p-${r.id}`, target: `o-${r.organization}`, style: { stroke: '#e8c07a' } },
      { id: `e-p-d-${r.id}`, source: `p-${r.id}`, target: `d-${r.datasetId}`, style: { stroke: '#7ee8ff' } },
    )
    r.domains.forEach((dom) => {
      edges.push({
        id: `e-o-m-${r.id}-${dom}`,
        source: `o-${r.organization}`,
        target: `m-${dom}`,
        style: { stroke: '#4de1c155' },
      })
    })
  })

  return { nodes, edges }
}
