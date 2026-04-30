import create from 'zustand'
import { Node, Edge, Connection, addEdge, applyNodeChanges, applyEdgeChanges, NodeChange, EdgeChange } from 'react-flow-renderer'
import { createClient } from '@/lib/supabase/client'

const supabase = createClient()

export type Mode = 'VIEW' | 'EDIT' | 'ADD'

export interface TreeState {
  mode: Mode
  nodes: Node[]
  edges: Edge[]
  selectedNodes: string[]
  searchQuery: string
  editingNodeId: string | null
  notification: { message: string, type: 'success' | 'error' } | null
  pendingChangesCount: number
  
  setMode: (mode: Mode) => void
  setNodes: (nodes: Node[] | ((nds: Node[]) => Node[])) => void
  setEdges: (edges: Edge[] | ((eds: Edge[]) => Edge[])) => void
  onNodesChange: (changes: NodeChange[]) => void
  onEdgesChange: (changes: EdgeChange[]) => void
  onConnect: (connection: Connection) => void
  toggleNodeSelection: (id: string) => void
  clearSelection: () => void
  setSearchQuery: (query: string) => void
  setEditingNodeId: (id: string | null) => void
  showNotification: (message: string, type?: 'success' | 'error') => void
  clearNotification: () => void
  submitChange: (change: any) => Promise<boolean>
  fetchPendingCount: () => Promise<void>
}

export const useTreeStore = create<TreeState>((set, get) => ({
  mode: 'VIEW',
  nodes: [],
  edges: [],
  selectedNodes: [],
  searchQuery: '',
  editingNodeId: null,
  notification: null,
  pendingChangesCount: 0,
  
  setMode: (mode) => set({ mode, editingNodeId: null }),
  
  setNodes: (update) => set((state) => ({
    nodes: typeof update === 'function' ? update(state.nodes) : update
  })),
  
  setEdges: (update) => set((state) => ({
    edges: typeof update === 'function' ? update(state.edges) : update
  })),
  
  onNodesChange: (changes) => {
    set({
      nodes: applyNodeChanges(changes, get().nodes),
    });
  },
  
  onEdgesChange: (changes) => {
    set({
      edges: applyEdgeChanges(changes, get().edges),
    });
  },
  
  onConnect: (connection) => {
    set({
      edges: addEdge(connection, get().edges),
    });
  },
  
  toggleNodeSelection: (id) => set((state) => {
    const selected = state.selectedNodes.includes(id)
      ? state.selectedNodes.filter(n => n !== id)
      : [...state.selectedNodes, id]
    return { selectedNodes: selected }
  }),
  
  clearSelection: () => set({ selectedNodes: [] }),
  setSearchQuery: (query) => set({ searchQuery: query }),
  setEditingNodeId: (id) => set({ editingNodeId: id }),
  
  showNotification: (message, type = 'success') => {
    set({ notification: { message, type } })
    setTimeout(() => {
      set({ notification: null })
    }, 3000)
  },
  
  clearNotification: () => set({ notification: null }),

  fetchPendingCount: async () => {
    if (!supabase) return
    const { count, error } = await supabase
      .from('inbox')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'Pending')
    
    if (!error && count !== null) {
      set({ pendingChangesCount: count })
    }
  },

  submitChange: async (change) => {
    console.log('Submitting change to database:', change)
    
    try {
      if (!supabase) {
        console.warn('Supabase not initialized, performing optimistic local update only')
        
        // Simulate a delay for realism
        await new Promise(resolve => setTimeout(resolve, 500))
        
        // If it's a new member, add them to the local nodes
        if (change.submission_type === 'New Member') {
          const newNode: Node = {
            id: `temp-${Date.now()}`,
            type: 'familyNode',
            position: { x: 0, y: 0 },
            data: { 
              ...change.raw_data, 
              label: change.raw_data.full_name,
              isMock: true 
            },
          }
          get().setNodes((nds) => nds.concat(newNode))
        }
        
        get().showNotification('Demo Mode: Change applied locally but not saved to database.', 'warning')
        set({ mode: 'VIEW', editingNodeId: null })
        return true
      }

      // 1. Insert into Inbox (Submission Queue)
      const { error } = await supabase.from('inbox').insert({
        submission_type: change.change_type === 'new_member' ? 'New Member' : 'Update Member',
        raw_data: change.proposed_data,
        submitter_name: change.submitted_by || 'Anonymous',
        status: 'Pending',
        linked_record_id: change.target_id || null,
        linked_record_type: 'family_member'
      })

      if (error) throw error

      // Update the count immediately after a successful submission
      get().fetchPendingCount()

      // 2. Optimistic UI Update: Update local nodes to show pending state
      if (change.change_type === 'edit_member' && change.target_id) {
        set((state) => ({
          nodes: state.nodes.map(node => 
            node.id === change.target_id 
              ? { ...node, data: { ...node.data, ...change.proposed_data, status: 'Pending' } }
              : node
          )
        }))
      } else if (change.change_type === 'new_member') {
        const newNode: Node = {
          id: `temp-${Date.now()}`,
          type: 'familyNode',
          position: { x: Math.random() * 500, y: Math.random() * 500 },
          data: { ...change.proposed_data, status: 'Pending' }
        }
        set((state) => ({
          nodes: [...state.nodes, newNode]
        }))
      }
      
      get().showNotification(
        change.change_type === 'new_member' 
          ? 'New member submitted for review!' 
          : 'Update submitted for review!'
      )
      
      set({ mode: 'VIEW', editingNodeId: null })
      return true
    } catch (error: any) {
      console.error('Submission failed:', error)
      get().showNotification(error.message || 'Submission failed', 'error')
      return false
    }
  }
}))
