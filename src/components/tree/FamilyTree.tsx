'use client'

import React, { useEffect, useMemo, useState, useCallback } from 'react'
import ReactFlow, { 
  Background, 
  Controls, 
  MiniMap,
  Node,
  Edge,
  NodeMouseHandler,
} from 'react-flow-renderer'
import dagre from 'dagre'
import { X } from 'lucide-react'
import FamilyNode from './FamilyNode'
import TreeToolbar from './TreeToolbar'
import AddMemberModal from './AddMemberModal'
import AdminReviewPanel from './AdminReviewPanel'
import NodeActionOverlay from './NodeActionOverlay'
import { useTreeStore } from './store'

const nodeTypes = {
  familyNode: FamilyNode,
}

const dagreGraph = new dagre.graphlib.Graph()
dagreGraph.setDefaultEdgeLabel(() => ({}))

const nodeWidth = 200
const nodeHeight = 100

const getLayoutedElements = (nodes: Node[], edges: Edge[]) => {
  dagreGraph.setGraph({ rankdir: 'TB', nodesep: 70, ranksep: 120 })

  nodes.forEach((node) => {
    dagreGraph.setNode(node.id, { width: nodeWidth, height: nodeHeight })
  })

  edges.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target)
  })

  dagre.layout(dagreGraph)

  return {
    nodes: nodes.map((node) => {
      const nodeWithPosition = dagreGraph.node(node.id)
      return {
        ...node,
        position: {
          x: nodeWithPosition.x - nodeWidth / 2,
          y: nodeWithPosition.y - nodeHeight / 2,
        },
      }
    }),
    edges,
  }
}

interface FamilyTreeProps {
  initialMembers: any[]
}

export default function FamilyTree({ initialMembers }: FamilyTreeProps) {
  const nodes = useTreeStore(state => state.nodes)
  const edges = useTreeStore(state => state.edges)
  const onNodesChange = useTreeStore(state => state.onNodesChange)
  const onEdgesChange = useTreeStore(state => state.onEdgesChange)
  const onConnect = useTreeStore(state => state.onConnect)
  const setNodes = useTreeStore(state => state.setNodes)
  const setEdges = useTreeStore(state => state.setEdges)
  const setEditingNodeId = useTreeStore(state => state.setEditingNodeId)
  const searchQuery = useTreeStore(state => state.searchQuery)
  const notification = useTreeStore(state => state.notification)
  const clearNotification = useTreeStore(state => state.clearNotification)
  
  const [isAdminPanelOpen, setIsAdminPanelOpen] = useState(false)

  // Initialize tree data
  useEffect(() => {
    if (initialMembers && initialMembers.length > 0) {
      const rawNodes: Node[] = initialMembers.map((member) => ({
        id: member.id,
        type: 'familyNode',
        data: { ...member },
        position: { x: 0, y: 0 },
      }))
      
      const rawEdges: Edge[] = []
      initialMembers.forEach((member) => {
        if (member.parent1_id) {
          rawEdges.push({
            id: `e-${member.parent1_id}-${member.id}`,
            source: member.parent1_id,
            target: member.id,
            animated: true,
            style: { stroke: '#94a3b8' },
          })
        }
        if (member.parent2_id) {
          rawEdges.push({
            id: `e-${member.parent2_id}-${member.id}`,
            source: member.parent2_id,
            target: member.id,
            animated: true,
            style: { stroke: '#94a3b8' },
          })
        }
      })
      
      const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(rawNodes, rawEdges)
      setNodes(layoutedNodes)
      setEdges(layoutedEdges)
    }
  }, [initialMembers, setNodes, setEdges])

  // Optimized Event Handlers
  const onNodeDoubleClick = useCallback<NodeMouseHandler>((event, node) => {
    event.preventDefault();
    setEditingNodeId(node.id);
  }, [setEditingNodeId]);

  return (
    <div className="w-full h-[800px] relative border border-gray-200 rounded-2xl overflow-hidden shadow-inner bg-gray-50 flex">
      <div className="flex-1 relative">
        <TreeToolbar onReviewClick={() => setIsAdminPanelOpen(true)} />
        
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onNodeDoubleClick={onNodeDoubleClick}
          nodeTypes={nodeTypes}
          fitView
          onlyRenderVisibleElements={true}
          elementsSelectable={true}
          nodesConnectable={false}
          nodesDraggable={true}
          zoomOnDoubleClick={false}
        >
          <Background color="#cbd5e1" gap={20} />
          <Controls className="mb-4" />
          <MiniMap 
            nodeColor="#3b82f6"
            maskColor="rgba(241, 245, 249, 0.6)"
            className="bottom-4 right-4"
          />
        </ReactFlow>
        
        <NodeActionOverlay />
        <AddMemberModal />

        {/* Notification Toast */}
        {notification && (
          <div className={`fixed bottom-8 left-1/2 -translate-x-1/2 px-6 py-3 rounded-xl shadow-2xl z-[200] flex items-center gap-3 animate-in slide-in-from-bottom duration-300 ${notification.type === 'error' ? 'bg-red-600 text-white' : 'bg-green-600 text-white'}`}>
            <span className="font-bold text-sm">{notification.message}</span>
            <button onClick={clearNotification} className="hover:bg-white/20 p-1 rounded"><X size={16} /></button>
          </div>
        )}
      </div>
      
      <AdminReviewPanel isOpen={isAdminPanelOpen} onClose={() => setIsAdminPanelOpen(false)} />
    </div>
  )
}
