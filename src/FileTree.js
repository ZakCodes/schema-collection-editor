import React from 'react';
import MuiTreeView from './../../material-ui-treeview/build/MuiTreeView.js';
import {join} from 'path';
import memoize from 'memoize-one';
const fs = eval("require('fs')"); // This is a temporary fix to make sure this statement is executed at runtime

/**
 * Stores the entry parameter in the [value property]{@link Node#path} and
 * joins the basePath with the value parameter in the [path property]{@link Node#path}.
 * @param {string} basePath - Base path of the node.
 * @param {string} entry - Name of the node.
 * @returns {Node}
 *
 * @class
 * @property {string} path - Full path of the node.
 * @property {string} filename - Name of the node in it's parent directory (with the file extension included). It's also the value shown in the tree view.
 * @property {string?} nodes - Name of the node in it's parent directory (with the file extension included).
 */
function Node(basePath, entry) {
    this.path = join(basePath, entry);
    this.value = entry;
}

/**
 * Gets the subdirectories of a given path
 * @param {string} path - The path of the directory
 * @returns {Node[]?} The child of the directory or null if the path isn't a directory
 */
function getSubdirs(path) {
    // If the node is a directory
    try {
        // Return all the items in the directory.
        return fs.readdirSync(path).map(entry => {
            // Return the new node.
            return new Node(path, entry);
        });
    } catch(error) {
        // Return null.
        return null;
    }
}

export class FileTree extends React.Component {
    constructor(props) {
        super(props);

        // Set the initial state
        this.state = {
            width: 200, //TODO load the previous width
        };

        // Bind `this` to the handlers.
        this.startDragging = this.startDragging.bind(this);
        this.stopDragging = this.stopDragging.bind(this);
        this.handleFileClick = this.handleFileClick.bind(this);
        this.handleFolderClick = this.handleFolderClick.bind(this);
    }

    tree = memoize(
        (directory) => {
            let tree = [];
            try {
                // Compute the tree.
                tree = fs.readdirSync(directory).map(entry => {
                    // Create a node for the entry.
                    const node = new Node(this.props.directory, entry);

                    // Read the nodes of the node.
                    let nodes = getSubdirs(node.path);

                    // If the node is a directory
                    if (nodes) {
                        // Set the nodes of the node.
                        node.nodes = nodes;

                        // Set the nodes as closed.
                        node.opened = false;
                    }

                    return node;
                });
            } catch(error) {
                // Alert the user.
                alert("The given path isn't a directory: " + directory);
                //TODO give different alerts for different errors. ex.:
                // * Not a directory
                // * Doesn't exist
                // * Access denied
            }
            return tree;
        }
    );

    handleFileClick(file) {
        if (this.props.onFileSelect)
            this.props.onFileSelect(file.path);
    }

    handleFolderClick(folder) {
        // Reverse the state of the folder.
        folder.opened = !folder.opened;

        // If the folder is opened
        if (folder.opened) {
            // Initialize the number of subdirectories to the number of nodes.
            let subdirs = folder.nodes.length;

            // For each node in the folder.
            for (let node of folder.nodes) {
                // Try to reaod .
                try {
                    node.nodes = fs.readdirSync(node.path).map(entry => {
                        return {
                            value: entry,
                            path: join(node.path, entry),
                        };
                    });
                } catch(error) {
                    // The node isn't a subdir.
                    // Remove a subdir from the total.
                    subdirs -= 1;
                }
            }

            // Rerender the view if there are sub-directories.
            if (subdirs > 0)
                this.setState({});
        }
    }

    /**
     * Detach the events from document.onmousemove and document.onmouseup to stop the dragging
     */
    startDragging(e) {
        // Get the first x position of the mouse.
        let prevPos = e.clientX;

        // Stop dragging when the mouse click is released.
        document.onmouseup = this.stopDragging;

        // When the mouse moves
        document.onmousemove = function(e) {
            // Get the mouse horizontal move.
            const delta = e.clientX - prevPos;

            // Set the
            prevPos = e.clientX;

            // If the mouse has moved
            if (delta !== 0)
                // Add the move to the width of the file tree.
                this.setState({
                    width: this.state.width + delta
                });
        }.bind(this);
    }
    /**
     * Detach the events from document.onmousemove and document.onmouseup to stop the dragging
     */
    stopDragging() {
        document.onmousemove = undefined;
        document.onmouseup = undefined;
    }

    render() {
        return (
            <div className="file-tree-container">
                <div className="file-tree" style={{width: this.state.width}}>
                    <MuiTreeView
                        tree={this.tree(this.props.directory)}
                        onLeafClick={this.handleFileClick}
                        onParentClick={this.handleFolderClick} />
                </div>
                <div
                    className="resize-bar"
                    onMouseDown={this.startDragging} />
            </div>
        );
    }
}

export default FileTree;
