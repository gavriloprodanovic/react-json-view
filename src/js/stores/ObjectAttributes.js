import {EventEmitter} from 'events';
import dispatcher from './../helpers/dispatcher';
import {toType} from './../helpers/util';

//store persistent display attributes for objects and arrays
class ObjectAttributes extends EventEmitter {

    objects = {}

    set = (rjvId, name, key, value) => {
        if (this.objects[rjvId] === undefined) {
            this.objects[rjvId] = {};
        }
        if (this.objects[rjvId][name] === undefined) {
            this.objects[rjvId][name] = {};
        }
        this.objects[rjvId][name][key] = value;
    }

    get = (rjvId, name, key, default_value) => {
        if (this.objects[rjvId] === undefined
            || this.objects[rjvId][name] === undefined
            || this.objects[rjvId][name][key] == undefined
        ) {
            return default_value;
        }
        return this.objects[rjvId][name][key];
    }

    onAddClickResultCallback = (action, result) => {
        const {rjvId, data, name} = action;
        data.new_value = { ...data.existing_value, ...result };
        dispatcher.dispatch({
            name: 'VARIABLE_ADDED',
            rjvId: rjvId,
            data: data
        });
    }

    handleAction = (action) => {
        const {rjvId, data, name} = action;
        switch (name) {
        case 'RESET':
            this.emit('reset-' + rjvId);
            break;
        case 'VARIABLE_UPDATED':
            action.data.updated_src = this.updateSrc(
                rjvId, data, name
            );
            this.set(
                rjvId, 'action', 'variable-update',
                {...data, type:'variable-edited'}
            );
            this.emit('variable-update-' + rjvId);
            break;
        case 'VARIABLE_REMOVED':
            action.data.updated_src = this.updateSrc(
                rjvId, data, name
            );
            this.set(
                rjvId, 'action', 'variable-update',
                {...data, type:'variable-removed'}
            );
            this.emit('variable-update-' + rjvId);
            break;
        case 'VARIABLE_ADDED':
            action.data.updated_src = this.updateSrc(
                rjvId, data, name
            );
            this.set(
                rjvId, 'action', 'variable-update',
                {...data, type:'variable-added'}
            );
            this.emit('variable-update-' + rjvId);
            break;
        case 'ADD_VARIABLE_KEY_REQUEST': {
            let doDefaultAction = true;

            if (data.onAddClick) {
                let handled = data.onAddClick(action, 
                    (result) => this.onAddClickResultCallback(action, result));
                doDefaultAction = !handled;
            }

            if (doDefaultAction) {
                this.set(rjvId, 'action', 'new-key-request', data);
                this.emit('add-key-request-' + rjvId);
            }
            break;
        }
        case 'INSERT_AFTER':
            action.data.updated_src = this.updateSrc(
                rjvId, data, name
            );
            this.set(
                rjvId, 'action', 'variable-update',
                {...data, type:'variable-inserted-after'}
            );
            this.emit('variable-update-' + rjvId);
            break;
        }

    }

    updateSrc = (rjvId, request, action_name) => {
        let {
            name, namespace, new_value, existing_value, variable_removed, insert_after,
            defaultValueGetter, updateProcessor
        } = request;

        namespace.shift();

        //deepy copy src
        let src = this.get(rjvId, 'global', 'src');
        //deep copy of src variable
        let srcDeepCopy = this.deepCopy(src, [...namespace]);
        let processedSrc = false;

        let useDefaultUpdateProcessor = true;
        
        if (updateProcessor) {
            processedSrc = updateProcessor(srcDeepCopy, request, action_name);
            if (processedSrc !== false) {
                useDefaultUpdateProcessor = false;
            }
        }

        if (useDefaultUpdateProcessor) {
            processedSrc = this.defaultUpdateProcessor(srcDeepCopy, request);
        }


        if (processedSrc !== false && processedSrc !== null) {
            this.set(
                rjvId, 'global', 'src', processedSrc
            );
        }

        return processedSrc;
    }

    defaultUpdateProcessor = (updated_src, request) => {
        let {
            name, namespace, new_value, variable_removed, insert_after,
            defaultValueGetter
        } = request;

        //point at current index
        let walk = updated_src;
        for (const idx of namespace) {
            walk = walk[idx];
        }


        if (variable_removed) {
            if (toType(walk) == 'array') {
                walk.splice(name, 1);
            } else {
                delete walk[name];
            }
        } else if(insert_after) {
            if (toType(walk) == 'array') {
                let insertIndex = parseInt(name) + 1;

                let value = undefined;
                if (defaultValueGetter !== undefined) {
                    value = defaultValueGetter(namespace, walk, name, updated_src);
                }

                walk.splice(insertIndex, 0, value);
            }
        } else {
            //update copied variable at specified namespace
            if (name !== null) {
                walk[name] = new_value;
            } else {
                updated_src = new_value;
            }
        }

        return updated_src;
    }

    deepCopy = (src, copy_namespace) => {
        const type = toType(src);
        let result;
        let idx = copy_namespace.shift();
        if (type == 'array') {
            result = [...src];
        } else if (type == 'object') {
            result = {...src};
        }
        if (idx !== undefined) {
            result[idx] = this.deepCopy(src[idx], copy_namespace);
        }
        return result;
    }
}

const attributeStore = new ObjectAttributes;
dispatcher.register(attributeStore.handleAction.bind(attributeStore));
export default attributeStore;
