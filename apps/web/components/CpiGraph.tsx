"use client";

import ReactFlow, { Background, Controls, type Edge } from "reactflow";
import "reactflow/dist/base.css";
import type { CpiNode } from "@lykta/core";
import { treeToReactFlow } from "@/lib/treeToReactFlow";
import CpiNodeCard from "@/components/CpiNodeCard";

const nodeTypes = { cpiNode: CpiNodeCard };

function styleEdges(
  edges: Edge[],
  nodeMap: Map<string, { data: { cpiNode: CpiNode } }>,
): Edge[] {
  return edges.map((edge) => {
    const failed = nodeMap.get(edge.target)?.data.cpiNode.failed ?? false;
    return {
      ...edge,
      animated: true,
      style: {
        stroke: failed ? "#ef4444" : "#22c55e",
        strokeWidth: 2,
      },
    };
  });
}

interface Props {
  cpiTree: CpiNode[];
}

export default function CpiGraph({ cpiTree }: Props) {
  const { nodes, edges } = treeToReactFlow(cpiTree);
  const nodeMap = new Map(nodes.map((n) => [n.id, n]));
  const styledEdges = styleEdges(edges, nodeMap);

  return (
    <div className="h-[500px] w-full rounded border border-gray-200">
      <ReactFlow
        nodes={nodes}
        edges={styledEdges}
        nodeTypes={nodeTypes}
        fitView
        proOptions={{ hideAttribution: false }}
      >
        <Background />
        <Controls />
      </ReactFlow>
    </div>
  );
}
