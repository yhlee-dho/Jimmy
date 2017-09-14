import React from 'react';
import ReactART from 'react-art';
import Container from 'samsio/Container';
import {GetNodeByID} from '../stores/nodestore';
import NodeStore from '../stores/nodestore';
import * as NodeActions from '../actions/nodes';
import Rectangle from '../util/rectangle';
import CLASS_COLOURS from '../util/wh_colours';

const CANVAS_WIDTH = 1800;
const CANVAS_HEIGHT = 600;

class NodeItem extends React.Component {
    constructor(props) {
        super(props);
        this.lastClick = 0;
    }

    render() {
        const fontStyle = {
            fontSize: '14',
            fontFamily: 'Verdana',
        };
        var pos = this.props.node.pos;
        if (this.props.nodekey === this.props.activeNode) {
            pos = {x: this.props.track.x - this.props.click.x, y: this.props.track.y - this.props.click.y};
        }
        return <ReactART.Group x={pos.x} y={pos.y} h={20} w={100} onMouseDown={this.handleMouseDown.bind(this)} cusor="pointer" onClick={this.handleClick.bind(this)}>
            <Rectangle x={0} y={0} width={200} height={20} fill="#212121" stroke={this.props.nodekey === this.props.activeNode ? "#aff" : "#000"}/>
            <ReactART.Text x={5} y={4} alignment="left" font={fontStyle} fill={CLASS_COLOURS[this.props.node.class]}>{this.props.node.class}</ReactART.Text>
            <ReactART.Text x={30} y={4} alignment="left" font={fontStyle} fill="#fff">{this.props.node.nickname}</ReactART.Text>
        </ReactART.Group>;
    }

    handleMouseDown(e) {
        NodeStore.updateState({
            activeNode: this.props.nodekey,
            click: {x: e.clientX - this.props.node.pos.x, y: e.clientY - this.props.node.pos.y},
        });
    }

    handleClick(e) {
        var now = Date.now();
        if (this.lastClick > (now - 500)) {
            NodeStore.updateState({
                selectedNode: this.props.node.id,
                renamingNode: true,
            });
        } else {
            NodeStore.updateState({
                selectedNode: this.props.node.id,
            });
        }
        this.lastClick = now;
    }
}

function trackPosAdd(node) {
    var state = NodeStore.getState();
    if (state.activeNode === false) return node;
    if (state.nodes[state.activeNode].id === node.id) {
        return Object.assign({}, node, {
            pos: {
                x: state.track.x - state.click.x,
                y: state.track.y - state.click.y,
            }
        });
    }
    return node;
}

const NODE_OFFSET_LEFT = {x: 0, y: 10};
const NODE_OFFSET_TOP = {x: 100, y: 0};
const NODE_OFFSET_RIGHT = {x: 200, y: 10};
const NODE_OFFSET_BOTTOM = {x: 100, y: 20};
const NODE_OFFSETS = [
    { // to the right
        fromPos: NODE_OFFSET_RIGHT,
        toPos: NODE_OFFSET_LEFT,
    },
    { // below
        fromPos: NODE_OFFSET_BOTTOM,
        toPos: NODE_OFFSET_TOP,
    },
    { // to the left
        fromPos: NODE_OFFSET_LEFT,
        toPos: NODE_OFFSET_RIGHT,
    },
    { // above
        fromPos: NODE_OFFSET_TOP,
        toPos: NODE_OFFSET_BOTTOM,
    },
];

class ConnectionItem extends React.Component {
    render() {
        var fromNode = trackPosAdd(GetNodeByID(this.props.node.nodes[0]));
        var toNode = trackPosAdd(GetNodeByID(this.props.node.nodes[1]));
        var path = ReactART.Path();
        var direction = Math.atan2(fromNode.pos.y - toNode.pos.y, fromNode.pos.x - toNode.pos.x);
        var offsetInd = Math.floor(((direction + Math.PI) * (2 / Math.PI)) + 0.5);
        if (offsetInd >= 4) offsetInd = 0;
        var offsets = NODE_OFFSETS[offsetInd];
        var fromPos = {x: fromNode.pos.x + offsets.fromPos.x, y: fromNode.pos.y + offsets.fromPos.y};
        var toPos = {x: toNode.pos.x + offsets.toPos.x, y: toNode.pos.y + offsets.toPos.y};
        var newDirection = Math.atan2(fromPos.y - toPos.y, fromPos.x - toPos.x);
        var xOff = Math.sin(-newDirection) * 2;
        var yOff = Math.cos(-newDirection) * 2;
        path.move(fromPos.x - xOff, fromPos.y - yOff);
        path.lineTo(toPos.x - xOff, toPos.y - yOff);
        path.lineTo(toPos.x + xOff, toPos.y + yOff);
        path.lineTo(fromPos.x + xOff, fromPos.y + yOff);
        path.lineTo(fromPos.x - xOff, fromPos.y - yOff);
        path.close();
        return <ReactART.Shape d={path} fill="#fff" stroke="#000" strokeWidth="1" cursor="pointer"/>
    }
}

class ConnectionGroup extends React.Component {
    render() {
        return <ReactART.Group>
            {this.props.connections.map(v => <ConnectionItem node={v} key={v.id} />)}
        </ReactART.Group>;
    }
}

class NodeList extends React.Component {
    render() {
        return <ReactART.Surface width={CANVAS_WIDTH} height={CANVAS_HEIGHT}>
            <ReactART.Group x={0} y={0} h={CANVAS_WIDTH} height={CANVAS_HEIGHT} onMouseMove={this.handleMouseMove.bind(this)} onMouseUp={this.handleMouseUp.bind(this)}>
                <Rectangle x={0} y={0} width={CANVAS_WIDTH} height={CANVAS_HEIGHT} fill="#606060" />
                {this.props.nodes.map((v, i) => (<NodeItem node={v} key={v.id} click={this.props.click} track={this.props.track} activeNode={this.props.activeNode} nodekey={i} />))}
            </ReactART.Group>
            <ConnectionGroup connections={this.props.connections}/>
        </ReactART.Surface>;
    }

    handleMouseMove(e) {
        NodeStore.updateState({
            track: {x: e.clientX, y: e.clientY},
        });
    }

    handleMouseUp(e) {
        if (this.props.activeNode === false) return;
        NodeActions.UpdateNodePosition(this.props.nodes[this.props.activeNode].id, {
            x: e.clientX - this.props.click.x,
            y: e.clientY - this.props.click.y,
        });
    }
}

class MapCanvas extends React.Component {
    render() {
        return <Container store={NodeStore}><NodeList /></Container>;
    }
}

export default MapCanvas;
