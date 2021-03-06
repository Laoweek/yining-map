import axios  from 'axios'
import YAML from 'js-yaml'
import runtime_config_path from '../../runtime_config_path.yaml'

export function load_config_files({commit, state}){
  let map_prom = axios
  .get(runtime_config_path.layers_index)
  .then(res => YAML.safeLoad(res.data) )
  
  let loc_index = axios
    .get(runtime_config_path.locations.index)
    .then(res => YAML.safeLoad(res.data) )

  let loc_template = axios
    .get(runtime_config_path.locations.templates)
    .then(res => YAML.safeLoad(res.data) )

  let loc_pin = axios
    .get(runtime_config_path.locations.pins)
    .then(res => YAML.safeLoad(res.data) )
  
  let info = axios
    .get(runtime_config_path.information)
    .then(res => YAML.safeLoad(res.data) )
    
  Promise.all([
    map_prom, 
    loc_index, 
    loc_template, 
    loc_pin,
    info]).then(([
      {map, layers}, 
      locations, 
      templates, 
      pins,
      information]) => {
    for(let loc of locations){
      let temps = []
      if(!loc.template){
        continue
      }else if(typeof loc.template === "string"){
        temps.push(loc.template)
      }else{
        temps = temps.concat(loc.template)
      }
      for(let template of temps){
        let tags = loc.tags || []
        let temp = templates[template]
        let update = {}
        if(!temp){
          throw new TypeError(`Unknown template: ${template} (loc: ${loc.name})`)
        }
        Object.assign(update, loc)
        Object.assign(update, temp)
        update.tags = temp.tags ? tags.concat(temp.tags) : tags
        Object.assign(loc, update)
      }
      let pin_name = loc.pin
      loc.pin = pins[pin_name]
      if(!loc.pin){
        throw new TypeError(`Unknown pin: ${pin_name} (loc: ${loc.name})`)
      }
    }
    commit('set_map_info', map)
    commit('set_layers', layers)
    commit('set_locations', locations)
    commit('set_information', information)
    commit('data_loaded')
  })
}