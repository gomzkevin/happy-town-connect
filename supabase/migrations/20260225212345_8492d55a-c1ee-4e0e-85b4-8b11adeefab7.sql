
-- Delete child records first, then parent quotes
DELETE FROM quote_services WHERE quote_id IN ('52937065-16d4-4c7c-9366-ecf95fde674c', 'ddbabd06-40e8-4349-b9c1-04ea57bdb115');
DELETE FROM quote_history WHERE quote_id IN ('52937065-16d4-4c7c-9366-ecf95fde674c', 'ddbabd06-40e8-4349-b9c1-04ea57bdb115');
DELETE FROM quotes WHERE id IN ('52937065-16d4-4c7c-9366-ecf95fde674c', 'ddbabd06-40e8-4349-b9c1-04ea57bdb115');
