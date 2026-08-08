revoke execute on function public.save_research_submission(text, uuid, jsonb) from authenticated;
revoke execute on function public.get_research_submission(text, uuid) from authenticated;
revoke execute on function public.withdraw_research_submission(text, uuid) from authenticated;
