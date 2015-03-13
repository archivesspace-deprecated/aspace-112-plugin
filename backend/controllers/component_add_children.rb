class ArchivesSpaceService < Sinatra::Base

  private
  
  def accept_children_response(target_class, child_class)
    target = target_class.get_or_die(params[:id])
    unless params[:children].empty?
      position = params[:position]
      parent_id = (target_class == child_class) ? params[:id] : nil
      # We need to be careful about the order these get processed in. If we're
      # moving from low to high, we need to work backwards to make sure the
      # final ordering ends up right.
      first_uri = params[:children][0]
      first_obj = child_class.get_or_die(child_class.my_jsonmodel.id_for(first_uri))
      ordered = if target.id == first_obj.parent_id && first_obj.absolute_position < position
                    params[:children].each_with_index.to_a.reverse
                else
                    params[:children].each_with_index
                end
    
      ordered.each do |uri, i|
        child = child_class.get_or_die(child_class.my_jsonmodel.id_for(uri))
        child.update_position_only(parent_id, position + i)
      end
    end
    updated_response(target)
  end

end
