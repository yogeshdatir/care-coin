import { Button } from '@/shared/components/ui/button';
import type { CatalogItem } from '@/shared/types';
import { useState, type ChangeEvent, type SubmitEvent } from 'react';

const INITIAL_CATALOG_ITEM = {
  id: Date.now().toString(),
  name: '',
  type: '',
};

const SettingsPage = () => {
  const [catalogItems, setCatalogItems] = useState<CatalogItem[]>([]);
  const [newCatalogItem, setNewCatalogItem] =
    useState<CatalogItem>(INITIAL_CATALOG_ITEM);

  const handleNewItemChange = (e: ChangeEvent<HTMLInputElement>) => {
    setNewCatalogItem((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleAddCatalogItems = (e: SubmitEvent) => {
    e.preventDefault();

    setCatalogItems((prev) => [...prev, newCatalogItem]);
    setNewCatalogItem(INITIAL_CATALOG_ITEM);
  };

  return (
    <div>
      <h1>MEDICAL CATALOG REGISTRY</h1>
      <p>Pre-define the variables that populate your health & dose logs.</p>
      <form onSubmit={handleAddCatalogItems}>
        <fieldset>
          <label>
            Item Name:
            <input
              name="name"
              value={newCatalogItem.name}
              onChange={handleNewItemChange}
            />
          </label>
        </fieldset>
        <fieldset>
          <label>
            Item Type:
            <input
              name="type"
              value={newCatalogItem.type}
              onChange={handleNewItemChange}
            />
          </label>
        </fieldset>
        <Button type="submit">Add to Medical Catalog</Button>
      </form>
      <div>
        <h1>ACTIVE TRACKING CATALOG</h1>
        <table>
          <thead>
            <tr>
              <th>Item Name</th>
              <th>Item Type</th>
            </tr>
          </thead>
          <tbody>
            {catalogItems.map(({ id, name, type }) => {
              return (
                <tr key={id}>
                  <td>{name}</td>
                  <td>{type}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default SettingsPage;
