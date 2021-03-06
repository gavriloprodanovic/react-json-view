import React from 'react';
import dispatcher from './../helpers/dispatcher';

import CopyToClipboard from './CopyToClipboard';
import {toType} from './../helpers/util';

//icons
import {
    RemoveCircle as Remove, AddCircle as Add
} from './icons';

//theme
import Theme from './../themes/getStyle';


export default class extends React.PureComponent {
    getObjectSize = () => {
        const {size, theme, displayObjectSize} = this.props;
        if (displayObjectSize) {
            return (
                <span class="object-size"
                    {...Theme(theme, 'object-size')}>
                    {size} item{size === 1 ? '' : 's'}
                </span>
            );
        }
    }

    getAddAttribute = () => {
        const {
            theme, namespace, name, src, rjvId, depth, onAddClick, updateProcessor
        } = this.props;

        return (
            <span
                class="click-to-add"
                style={{verticalAlign: 'top'}}>
                <Add
                    class="click-to-add-icon"
                    {...Theme(theme, 'addVarIcon')}
                    onClick={() => {
                        const request = {
                            name: depth > 0 ? name : null,
                            namespace: namespace.splice(
                                0, (namespace.length-1)
                            ),
                            existing_value: src,
                            variable_removed: false,
                            key_name: null,
                            onAddClick: onAddClick,
                            updateProcessor: updateProcessor
                        };
                        if (toType(src) === 'object') {
                            dispatcher.dispatch({
                                name: 'ADD_VARIABLE_KEY_REQUEST',
                                rjvId: rjvId,
                                data: request,
                            });
                        } else {
                            dispatcher.dispatch({
                                name: 'VARIABLE_ADDED',
                                rjvId: rjvId,
                                data: {
                                    ...request,
                                    new_value: [...src, null]
                                }
                            });
                        }
                    }}
                />
            </span>
        );
    }

    getInsertAfterAttribute = () => {
        const {
            theme, namespace, name, src, rjvId, depth, defaultValueGetter, updateProcessor
        } = this.props;

        return (
            <span
                class="click-to-add"
                style={{verticalAlign: 'top'}}>
                <Add
                    class="click-to-add-icon"
                    {...Theme(theme, 'addVarIcon')}
                    onClick={() => {
                        dispatcher.dispatch({
                            name: 'INSERT_AFTER',
                            rjvId: rjvId,
                            data: {
                                name: -1,
                                namespace: namespace,
                                insert_after: true,
                                defaultValueGetter: defaultValueGetter,
                                updateProcessor: updateProcessor
                            }
                        });
                        
                    }}
                />
            </span>
        );
    }

    getRemoveObject = () => {
        const {
            theme, hover, namespace, name, src, rjvId, updateProcessor
        } = this.props;

        //don't allow deleting of root node
        if (namespace.length === 1) {
            return;
        }
        return (
            <span class="click-to-remove" >
                <Remove
                    class="click-to-remove-icon"
                    {...Theme(theme, 'removeVarIcon')}
                    onClick={() => {
                        dispatcher.dispatch({
                            name: 'VARIABLE_REMOVED',
                            rjvId: rjvId,
                            data: {
                                name: name,
                                namespace: namespace.splice(0, (namespace.length-1)),
                                existing_value: src,
                                variable_removed: true,
                                updateProcessor: updateProcessor
                            },
                        });
                    }}
                />
            </span>
        );
    }

    render = () => {
        const {
            theme,
            onDelete,
            onAdd,
            onInsertAfter,
            enableClipboard,
            src,
            namespace,
            type
        } = this.props;
        return (
            <div
                {...Theme(theme, 'object-meta-data')}
                class='object-meta-data'
                onClick={(e)=>{
                    e.stopPropagation();
                }}
            >
                {/* size badge display */}
                {this.getObjectSize()}
                {/* copy to clipboard icon */}
                {enableClipboard
                    ? (<CopyToClipboard
                        clickCallback={enableClipboard}
                        {...{src, theme, namespace}} />)
                    : null
                }
                {/* copy add/remove icons */}
                {onAdd !== false && type !== 'array' ? this.getAddAttribute() : null}
                {onDelete !== false ? this.getRemoveObject() : null}
                {onInsertAfter !== false  && type === 'array'
                    ? this.getInsertAfterAttribute()
                    : null}
            </div>
        );
    }

}
