import { Button } from '@/shared/components/ui/button';

const SettingsPage = () => {
  return (
    <div>
      <h1>MEDICAL CATALOG REGISTRY</h1>
      <p>Pre-define the variables that populate your health & dose logs.</p>
      <form>
        <fieldset>
          <label>Item Name:</label>
          <input />
        </fieldset>
        <fieldset>
          <label>Item Type:</label>
          <input />
        </fieldset>
        <Button type="button">Add to Medical Catalog</Button>
      </form>
      <div>
        <h1>ACTIVE TRACKING CATALOG</h1>
        <ul></ul>
      </div>
    </div>
  );
};

export default SettingsPage;
