package org.base.augmented_reality_core;

import android.content.Context;
import android.os.Handler;
import android.widget.Toast;
import com.google.ar.core.ArCoreApk;


public class ARCore {
    ArCoreApk.Availability availability;
    public void show(Context context){
        CharSequence text = "Hello NativeScript!";
        int duration = Toast.LENGTH_SHORT;

        Toast toast = Toast.makeText(context, text, duration);
        toast.show();
    }
    public boolean checkAvaibility(final Context context){
        if(this.availability == null){
            this.availability = ArCoreApk.getInstance().checkAvailability(context);
        }
        if(this.availability.isTransient()){
            new Handler().postDelayed(new Runnable(){
                @Override
                public void run(){
                    checkAvaibility(context);
                }
            }, 200);
        }
        if(this.availability.isSupported()){
            return true;
        }
        else{
            return false;
        }
    }
}
